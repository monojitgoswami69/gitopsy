import { ForensicCommit } from "@/types/domain";

export interface TemporalAnalytics {
  timezone: string;
  timezoneAbbr: string;
  activeStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  longestInactiveGapDays: number;
  peakDailyCommits: number;
  busiestHour: number; // 0 - 23 in local timezone
  busiestWeekday: string;
  busiestMonth: string;
  commitsByHour: number[]; // 24 items
  commitsByWeekday: number[]; // 7 items (0 = Sun .. 6 = Sat)
  commitsByMonth: { month: string; count: number; additions: number; deletions: number }[];
  heatmapCalendar: { date: string; count: number; additions: number; deletions: number }[];
  nightCommitPercentage: number; // 21:00 - 04:59 in local timezone
  weekendCommitPercentage: number; // Sat + Sun in local timezone
}

export interface LocalTimeParts {
  hour: number; // 0 - 23
  weekday: number; // 0 (Sun) - 6 (Sat)
  dateStr: string; // YYYY-MM-DD
  monthStr: string; // YYYY-MM
}

const TIMEZONE_ABBR_MAP: Record<string, string> = {
  "Asia/Kolkata": "IST",
  "Asia/Calcutta": "IST",
  "Asia/Colombo": "IST",
  "Asia/Dhaka": "BST",
  "Asia/Dubai": "GST",
  "Asia/Karachi": "PKT",
  "Asia/Kathmandu": "NPT",
  "Asia/Singapore": "SGT",
  "Asia/Hong_Kong": "HKT",
  "Asia/Tokyo": "JST",
  "Asia/Seoul": "KST",
  "Asia/Shanghai": "CST",
  "Asia/Bangkok": "ICT",
  "Asia/Jakarta": "WIB",
  "Australia/Sydney": "AEST",
  "Australia/Melbourne": "AEST",
  "Australia/Brisbane": "AEST",
  "Australia/Perth": "AWST",
  "Europe/London": "GMT",
  "Europe/Paris": "CET",
  "Europe/Berlin": "CET",
  "Europe/Rome": "CET",
  "Europe/Madrid": "CET",
  "Europe/Amsterdam": "CET",
  "Europe/Zurich": "CET",
  "Europe/Athens": "EET",
  "America/New_York": "EST",
  "America/Chicago": "CST",
  "America/Denver": "MST",
  "America/Los_Angeles": "PST",
  "America/Phoenix": "MST",
  "America/Toronto": "EST",
  "America/Vancouver": "PST",
  "America/Sao_Paulo": "BRT",
  "America/Buenos_Aires": "ART",
  "Africa/Cairo": "EEST",
  "Africa/Johannesburg": "SAST",
  "Africa/Lagos": "WAT",
  "UTC": "UTC",
};

export function getTimezoneInfo(userTz?: string): { timezone: string; timezoneAbbr: string } {
  let timezone = "UTC";
  try {
    timezone =
      userTz ||
      (typeof Intl !== "undefined" && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC") ||
      "UTC";
  } catch {
    timezone = "UTC";
  }

  if (TIMEZONE_ABBR_MAP[timezone]) {
    return { timezone, timezoneAbbr: TIMEZONE_ABBR_MAP[timezone] };
  }

  let timezoneAbbr = timezone;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    timezoneAbbr = parts.find((p) => p.type === "timeZoneName")?.value || timezone;
  } catch {
    timezoneAbbr = timezone;
  }

  return { timezone, timezoneAbbr };
}

export function createLocalDateExtractor(timezone: string) {
  let dtf: Intl.DateTimeFormat | null = null;
  try {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      hourCycle: "h23",
      weekday: "short",
    });
  } catch {
    dtf = null;
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return function extractLocalParts(date: Date): LocalTimeParts {
    if (dtf) {
      try {
        const parts = dtf.formatToParts(date);
        let year = "1970";
        let month = "01";
        let day = "01";
        let hour = 0;
        let weekday = 0;

        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          if (p.type === "hour") {
            hour = parseInt(p.value, 10) % 24;
          } else if (p.type === "day") {
            day = p.value;
          } else if (p.type === "month") {
            month = p.value;
          } else if (p.type === "year") {
            year = p.value;
          } else if (p.type === "weekday") {
            weekday = weekdayMap[p.value] ?? 0;
          }
        }

        return {
          hour,
          weekday,
          dateStr: `${year}-${month}-${day}`,
          monthStr: `${year}-${month}`,
        };
      } catch {
        // Fall back to UTC
      }
    }

    const hour = date.getUTCHours();
    const weekday = date.getUTCDay();
    const dateStr = date.toISOString().slice(0, 10);
    const monthStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return { hour, weekday, dateStr, monthStr };
  };
}

export function calculateTemporalAnalytics(
  commits: ForensicCommit[],
  weeklyStats?: { w: number; a: number; d: number; c: number }[],
  targetTimezone?: string
): TemporalAnalytics {
  const { timezone, timezoneAbbr } = getTimezoneInfo(targetTimezone);
  const extractLocalParts = createLocalDateExtractor(timezone);

  const hourCounts = new Array(24).fill(0);
  const weekdayCounts = new Array(7).fill(0);
  const monthMap = new Map<string, { count: number; additions: number; deletions: number }>();
  const dateMap = new Map<string, { count: number; additions: number; deletions: number }>();

  let nightCommits = 0;
  let weekendCommits = 0;

  for (const c of commits) {
    const d = new Date(c.authorDate);
    const { hour, weekday, dateStr, monthStr } = extractLocalParts(d);

    hourCounts[hour]++;
    weekdayCounts[weekday]++;

    // Night window: 21:00 - 04:59 in the developer's local timezone (8-hour band)
    if (hour >= 21 || hour <= 4) {
      nightCommits++;
    }
    // Weekend window: Saturday & Sunday in developer's local timezone
    if (weekday === 0 || weekday === 6) {
      weekendCommits++;
    }

    const m = monthMap.get(monthStr) || { count: 0, additions: 0, deletions: 0 };
    m.count++;
    m.additions += c.additions;
    m.deletions += c.deletions;
    monthMap.set(monthStr, m);

    const day = dateMap.get(dateStr) || { count: 0, additions: 0, deletions: 0 };
    day.count++;
    day.additions += c.additions;
    day.deletions += c.deletions;
    dateMap.set(dateStr, day);
  }

  // If authoritative weekly stats from GitHub contributor endpoints are available,
  // synchronize the monthly AND daily additions/deletions so charts reflect total churn.
  if (weeklyStats && weeklyStats.length > 0) {
    const totalWeeklyAdditions = weeklyStats.reduce((acc, w) => acc + (w.a || 0), 0);
    const totalWeeklyDeletions = weeklyStats.reduce((acc, w) => acc + (w.d || 0), 0);

    if (totalWeeklyAdditions > 0 || totalWeeklyDeletions > 0) {
      // Weekly stat records arrive PER REPO, so the same calendar date can
      // legitimately receive churn from several repos within the same week.
      // Everything therefore accumulates into per-date buckets first —
      // assigning directly onto day objects previously let whichever repo
      // processed last overwrite every earlier one (weeks going dark while
      // the monthly totals stayed inflated).
      const churnByDate = new Map<string, { additions: number; deletions: number }>();

      for (const w of weeklyStats) {
        const weekAdditions = w.a || 0;
        const weekDeletions = w.d || 0;
        if (weekAdditions === 0 && weekDeletions === 0) continue;

        const weekStart = new Date(w.w * 1000);

        const activeDays: { dateStr: string; count: number }[] = [];
        let totalWeekDayCommits = 0;
        for (let d = 0; d < 7; d++) {
          const dayDate = new Date(weekStart.getTime() + d * 86400000);
          const { dateStr } = extractLocalParts(dayDate);
          const dayData = dateMap.get(dateStr);
          if (dayData && dayData.count > 0) {
            activeDays.push({ dateStr, count: dayData.count });
            totalWeekDayCommits += dayData.count;
          }
        }

        if (activeDays.length > 0 && totalWeekDayCommits > 0) {
          // Distribute proportionally to each day's real commit volume.
          for (const ad of activeDays) {
            const ratio = ad.count / totalWeekDayCommits;
            const bucket = churnByDate.get(ad.dateStr) || { additions: 0, deletions: 0 };
            bucket.additions += weekAdditions * ratio;
            bucket.deletions += weekDeletions * ratio;
            churnByDate.set(ad.dateStr, bucket);
          }
        } else {
          // No commits sampled for this week (e.g. capped sampling): fall back
          // to an even spread across the seven days WITHOUT inventing activity.
          for (let d = 0; d < 7; d++) {
            const dayDate = new Date(weekStart.getTime() + d * 86400000);
            const { dateStr } = extractLocalParts(dayDate);
            const bucket = churnByDate.get(dateStr) || { additions: 0, deletions: 0 };
            bucket.additions += weekAdditions / 7;
            bucket.deletions += weekDeletions / 7;
            churnByDate.set(dateStr, bucket);
          }
        }
      }

      // Reset previously commit-derived churn, then refill monthly aggregation.
      for (const m of monthMap.values()) {
        m.additions = 0;
        m.deletions = 0;
      }
      for (const [dateStr, churn] of churnByDate.entries()) {
        // Attribute each DATE's churn to the month that date actually falls
        // in, so a week straddling two months is split at the real boundary
        // instead of landing entirely in its start month.
        const monthStr = `${dateStr.slice(0, 4)}-${dateStr.slice(5, 7)}`;
        const m = monthMap.get(monthStr) || { count: 0, additions: 0, deletions: 0 };
        m.additions += Math.round(churn.additions);
        m.deletions += Math.round(churn.deletions);
        monthMap.set(monthStr, m);
      }

      for (const [dateStr, churn] of churnByDate.entries()) {
        const dayData = dateMap.get(dateStr) || { count: 0, additions: 0, deletions: 0 };
        // Weekly contributor stats are the authoritative churn source: dates
        // covered by them get the cross-repo-accumulated allocation ASSIGNED
        // (not added on top of the sparse per-commit diff sample). Deliberately
        // do NOT touch day.count: inflating or inventing counts here corrupted
        // streaks, totalActiveDays and peak-day metrics.
        dayData.additions = Math.round(churn.additions);
        dayData.deletions = Math.round(churn.deletions);
        dateMap.set(dateStr, dayData);
      }
    }
  }

  // Calculate Streaks — only days with REAL commits count as active; dates
  // carrying synced churn but zero commits (stat spread over unsampled weeks)
  // must not fabricate streaks or active-day totals.
  const uniqueDatesSorted = Array.from(dateMap.entries())
    .filter(([, val]) => val.count > 0)
    .map(([date]) => date)
    .sort();
  let longestStreak = 0;
  let currentRunningStreak = 0;
  let activeStreak = 0;

  if (uniqueDatesSorted.length > 0) {
    let prevEpochDays: number | null = null;

    for (let i = 0; i < uniqueDatesSorted.length; i++) {
      const parts = uniqueDatesSorted[i].split("-").map(Number);
      const epochDay = Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / (1000 * 60 * 60 * 24));

      if (prevEpochDays === null || epochDay === prevEpochDays + 1) {
        currentRunningStreak++;
      } else if (epochDay === prevEpochDays) {
        continue;
      } else {
        currentRunningStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentRunningStreak);
      prevEpochDays = epochDay;
    }

    const todayDateStr = extractLocalParts(new Date()).dateStr;
    const todayParts = todayDateStr.split("-").map(Number);
    const todayEpoch = Math.floor(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]) / (1000 * 60 * 60 * 24));
    const lastCommitEpoch = prevEpochDays || 0;
    if (todayEpoch - lastCommitEpoch <= 1) {
      activeStreak = currentRunningStreak;
    }
  }

  // Calculate Inactivity Hiatus & Peak Daily Commits
  let longestInactiveGapDays = 0;
  if (uniqueDatesSorted.length > 1) {
    for (let i = 1; i < uniqueDatesSorted.length; i++) {
      const prevParts = uniqueDatesSorted[i - 1].split("-").map(Number);
      const currParts = uniqueDatesSorted[i].split("-").map(Number);
      const prevEpoch = Math.floor(Date.UTC(prevParts[0], prevParts[1] - 1, prevParts[2]) / (1000 * 60 * 60 * 24));
      const currEpoch = Math.floor(Date.UTC(currParts[0], currParts[1] - 1, currParts[2]) / (1000 * 60 * 60 * 24));
      const gap = Math.max(0, currEpoch - prevEpoch - 1);
      if (gap > longestInactiveGapDays) {
        longestInactiveGapDays = gap;
      }
    }
  }

  let peakDailyCommits = 0;
  dateMap.forEach((val) => {
    if (val.count > peakDailyCommits) {
      peakDailyCommits = val.count;
    }
  });

  // Busiest determinations
  let maxHour = 0;
  let maxHourCount = -1;
  hourCounts.forEach((cnt, hr) => {
    if (cnt > maxHourCount) {
      maxHourCount = cnt;
      maxHour = hr;
    }
  });

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let maxWeekdayIdx = 0;
  let maxWeekdayCount = -1;
  weekdayCounts.forEach((cnt, idx) => {
    if (cnt > maxWeekdayCount) {
      maxWeekdayCount = cnt;
      maxWeekdayIdx = idx;
    }
  });

  let busiestMonth = "N/A";
  let maxMonthCount = -1;
  monthMap.forEach((val, m) => {
    if (val.count > maxMonthCount) {
      maxMonthCount = val.count;
      busiestMonth = m;
    }
  });

  const total = Math.max(1, commits.length);

  return {
    timezone,
    timezoneAbbr,
    activeStreakDays: activeStreak,
    longestStreakDays: longestStreak,
    totalActiveDays: uniqueDatesSorted.length,
    longestInactiveGapDays,
    peakDailyCommits,
    busiestHour: maxHour,
    busiestWeekday: weekdayNames[maxWeekdayIdx],
    busiestMonth,
    commitsByHour: hourCounts,
    commitsByWeekday: weekdayCounts,
    commitsByMonth: Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, ...data })),
    heatmapCalendar: Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data })),
    nightCommitPercentage: Math.round((nightCommits / total) * 100),
    weekendCommitPercentage: Math.round((weekendCommits / total) * 100),
  };
}
