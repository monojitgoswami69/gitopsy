import { ForensicGitHubClient } from "./client";

export interface GraphQLContributionCalendar {
  totalContributions: number;
  weeks: {
    contributionDays: {
      contributionCount: number;
      date: string;
      weekday: number;
    }[];
  }[];
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
  weekday: number;
}

/**
 * Merge multiple contribution calendars into one.
 *
 * Windows abut exactly (the next window starts at the previous window's end
 * instant), so GitHub's from/to inclusivity semantics are unknowable here.
 * Rather than guessing, dedupe by calendar date: each day is counted exactly
 * once and totalContributions is recomputed from the unique days. This is
 * correct whether GitHub treats the window endpoints as inclusive or
 * exclusive — no double-counted days, no skipped days.
 */
function mergeCalendars(calendars: (GraphQLContributionCalendar | null)[]): GraphQLContributionCalendar | null {
  const valid = calendars.filter((c): c is GraphQLContributionCalendar => c !== null);
  if (valid.length === 0) return null;

  const dayMap = new Map<string, { contributionCount: number; date: string; weekday: number }>();
  for (const cal of valid) {
    for (const week of cal.weeks) {
      for (const day of week.contributionDays) {
        if (!dayMap.has(day.date)) {
          dayMap.set(day.date, day);
        }
      }
    }
  }

  const days = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Rebuild Sunday-anchored weekly buckets from the sorted unique days.
  const weeks: GraphQLContributionCalendar["weeks"] = [];
  let currentWeek: GraphQLContributionCalendar["weeks"][number] | null = null;
  let currentWeekSunday = "";

  for (const day of days) {
    const dayDate = new Date(`${day.date}T00:00:00Z`);
    const sunday = new Date(dayDate);
    sunday.setUTCDate(sunday.getUTCDate() - dayDate.getUTCDay());
    const sundayKey = sunday.toISOString().slice(0, 10);

    if (!currentWeek || sundayKey !== currentWeekSunday) {
      currentWeek = { contributionDays: [] };
      currentWeekSunday = sundayKey;
      weeks.push(currentWeek);
    }
    currentWeek.contributionDays.push(day);
  }

  const totalContributions = days.reduce((sum, d) => sum + (d.contributionCount || 0), 0);
  return { totalContributions, weeks };
}

export class ForensicGitHubGraphQL {
  constructor(private client: ForensicGitHubClient) {}

  /**
   * Fetch the viewer's contribution calendar. GitHub limits each query to a
   * 365-day window, so for multi-year spans we fire one query per year and
   * merge. Each query costs ~365 rate-limit points (one per day returned).
   */
  public async getViewerContributions(
    from?: string,
    to?: string,
    years: number = 1
  ): Promise<GraphQLContributionCalendar | null> {
    const query = `
      query ($from: DateTime, $to: DateTime) {
        viewer {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    const windows = this.buildDateWindows(from, to, years);
    const calendars: (GraphQLContributionCalendar | null)[] = [];

    for (const win of windows) {
      try {
        const data = await this.client.fetchGraphQL<{
          viewer: {
            contributionsCollection: {
              contributionCalendar: GraphQLContributionCalendar;
            } | null;
          };
        }>(query, { from: win.from, to: win.to });
        calendars.push(data.viewer?.contributionsCollection?.contributionCalendar || null);
      } catch {
        // one year may fail; continue with others
      }
    }

    return mergeCalendars(calendars);
  }

  /**
   * Fetch a specific user's contribution calendar. Same 365-day window
   * constraint applies — multi-year spans are split and merged.
   */
  public async getUserContributions(
    login: string,
    from?: string,
    to?: string,
    years: number = 1
  ): Promise<GraphQLContributionCalendar | null> {
    const query = `
      query ($login: String!, $from: DateTime, $to: DateTime) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    const windows = this.buildDateWindows(from, to, years);
    const calendars: (GraphQLContributionCalendar | null)[] = [];

    for (const win of windows) {
      try {
        const data = await this.client.fetchGraphQL<{
          user: {
            contributionsCollection: {
              contributionCalendar: GraphQLContributionCalendar;
            } | null;
          } | null;
        }>(query, { login, from: win.from, to: win.to });
        calendars.push(data.user?.contributionsCollection?.contributionCalendar || null);
      } catch {
        // one year may fail; continue with others
      }
    }

    return mergeCalendars(calendars);
  }

  /**
   * Build a list of 365-day windows covering the requested span.
   * If `from` is provided, starts from there. Otherwise starts from
   * (now - years). If `to` is provided, ends there, otherwise ends at now.
   *
   * GitHub enforces that `from` and `to` within a single
   * contributionsCollection query must span <= 365 days.
   */
  private buildDateWindows(
    from: string | undefined,
    to: string | undefined,
    years: number
  ): { from: string | undefined; to: string | undefined }[] {
    const now = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(now);
    if (!from) {
      start.setFullYear(start.getFullYear() - years);
    }

    const windows: { from: string | undefined; to: string | undefined }[] = [];
    let cursor = new Date(start);

    while (cursor < now) {
      const winEnd = new Date(cursor);
      winEnd.setDate(winEnd.getDate() + 365);
      const actualEnd = winEnd > now ? now : winEnd;
      windows.push({
        from: cursor.toISOString(),
        to: actualEnd.toISOString(),
      });
      // Abut the next window at this window's end instant. Any boundary-day
      // overlap between windows is neutralized by date-keyed dedup in
      // mergeCalendars, so no day can be skipped or double-counted.
      cursor = actualEnd;
    }

    if (windows.length === 0) {
      windows.push({ from, to });
    }

    return windows;
  }

  public flattenCalendar(calendar: GraphQLContributionCalendar | null): ContributionDay[] {
    if (!calendar) return [];
    const days: ContributionDay[] = [];
    for (const week of calendar.weeks) {
      for (const day of week.contributionDays) {
        days.push(day);
      }
    }
    return days;
  }
}
