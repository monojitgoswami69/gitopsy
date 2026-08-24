import { ForensicCommit } from "@/types/domain";

export interface TemporalAnalytics {
  activeStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  busiestHour: number; // 0 - 23
  busiestWeekday: string;
  busiestMonth: string;
  commitsByHour: number[]; // 24 items
  commitsByWeekday: number[]; // 7 items (0 = Sun .. 6 = Sat)
  commitsByMonth: { month: string; count: number; additions: number; deletions: number }[];
  heatmapCalendar: { date: string; count: number; additions: number; deletions: number }[];
  nightCommitPercentage: number; // 9 PM - 4 AM
  weekendCommitPercentage: number; // Sat + Sun
}

export function calculateTemporalAnalytics(
  commits: ForensicCommit[],
  weeklyStats?: { w: number; a: number; d: number; c: number }[]
): TemporalAnalytics {
  const hourCounts = new Array(24).fill(0);
  const weekdayCounts = new Array(7).fill(0);
  const monthMap = new Map<string, { count: number; additions: number; deletions: number }>();
  const dateMap = new Map<string, { count: number; additions: number; deletions: number }>();

  let nightCommits = 0;
  let weekendCommits = 0;

  for (const c of commits) {
    const d = new Date(c.authorDate);
    const hour = d.getUTCHours();
    const weekday = d.getUTCDay();
    const dateStr = d.toISOString().slice(0, 10);
    const monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

    hourCounts[hour]++;
    weekdayCounts[weekday]++;

    // Night window: 21:00 - 04:59 UTC (8-hour band)
    if (hour >= 21 || hour <= 4) {
      nightCommits++;
    }
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
  // synchronize the monthly AND daily additions/deletions so the charts reflect
  // total churn accurately — not just the 5 detailed commits per repo.
  if (weeklyStats && weeklyStats.length > 0) {
    const totalWeeklyAdditions = weeklyStats.reduce((acc, w) => acc + (w.a || 0), 0);
    const totalWeeklyDeletions = weeklyStats.reduce((acc, w) => acc + (w.d || 0), 0);

    if (totalWeeklyAdditions > 0 || totalWeeklyDeletions > 0) {
      // --- Sync monthly data ---
      for (const m of monthMap.values()) {
        m.additions = 0;
        m.deletions = 0;
      }

      for (const w of weeklyStats) {
        if ((w.a || 0) > 0 || (w.d || 0) > 0 || (w.c || 0) > 0) {
          const weekDate = new Date(w.w * 1000);
          const monthStr = `${weekDate.getUTCFullYear()}-${String(weekDate.getUTCMonth() + 1).padStart(2, "0")}`;
          const m = monthMap.get(monthStr) || { count: 0, additions: 0, deletions: 0 };
          m.additions += w.a || 0;
          m.deletions += w.d || 0;
          monthMap.set(monthStr, m);
        }
      }

      // --- Sync daily heatmap data ---
      // Distribute each week's additions/deletions proportionally across
      // the days that have commits in that week. This gives every active
      // day real churn data instead of zeros from un-detailed commits.
      for (const w of weeklyStats) {
        const weekAdditions = w.a || 0;
        const weekDeletions = w.d || 0;
        const weekCommits = w.c || 0;
        if ((weekAdditions === 0 && weekDeletions === 0) || weekCommits === 0) continue;

        // Find the date range for this week (7 days starting from w.w)
        const weekStart = new Date(w.w * 1000);
        const weekStartStr = weekStart.toISOString().slice(0, 10);

        // Collect all days in this week that have commits
        const weekDays: string[] = [];
        const weekDayCommitCounts: number[] = [];
        let totalWeekDayCommits = 0;

        for (let d = 0; d < 7; d++) {
          const day = new Date(weekStart);
          day.setUTCDate(day.getUTCDate() + d);
          const dayStr = day.toISOString().slice(0, 10);
          const dayData = dateMap.get(dayStr);
          if (dayData && dayData.count > 0) {
            weekDays.push(dayStr);
            weekDayCommitCounts.push(dayData.count);
            totalWeekDayCommits += dayData.count;
          }
        }

        // Distribute the week's churn proportionally across active days
        if (totalWeekDayCommits > 0 && weekDays.length > 0) {
          for (let i = 0; i < weekDays.length; i++) {
            const ratio = weekDayCommitCounts[i] / totalWeekDayCommits;
            const dayData = dateMap.get(weekDays[i])!;
            dayData.additions = Math.round(weekAdditions * ratio);
            dayData.deletions = Math.round(weekDeletions * ratio);
          }
        }
      }
    }
  }

  // Calculate Streaks
  const uniqueDatesSorted = Array.from(dateMap.keys()).sort();
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
        // Same day (duplicate, already deduped via dateMap) — skip
        continue;
      } else {
        currentRunningStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentRunningStreak);
      prevEpochDays = epochDay;
    }

    // Active streak: the streak ending at the most recent commit date.
    // Only counts if the last commit was today or yesterday (within 1 day of now).
    const todayEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const lastCommitEpoch = prevEpochDays || 0;
    if (todayEpoch - lastCommitEpoch <= 1) {
      activeStreak = currentRunningStreak;
    }
  }

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
    activeStreakDays: activeStreak,
    longestStreakDays: longestStreak,
    totalActiveDays: uniqueDatesSorted.length,
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
