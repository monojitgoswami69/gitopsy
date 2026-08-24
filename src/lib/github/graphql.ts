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

export class ForensicGitHubGraphQL {
  constructor(private client: ForensicGitHubClient) {}

  public async getViewerContributions(from?: string, to?: string): Promise<GraphQLContributionCalendar | null> {
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

    try {
      const data = await this.client.fetchGraphQL<{
        viewer: {
          contributionsCollection: {
            contributionCalendar: GraphQLContributionCalendar;
          } | null;
        };
      }>(query, { from, to });

      return data.viewer?.contributionsCollection?.contributionCalendar || null;
    } catch {
      return null;
    }
  }

  public async getUserContributions(login: string, from?: string, to?: string): Promise<GraphQLContributionCalendar | null> {
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

    try {
      const data = await this.client.fetchGraphQL<{
        user: {
          contributionsCollection: {
            contributionCalendar: GraphQLContributionCalendar;
          } | null;
        } | null;
      }>(query, { login, from, to });

      return data.user?.contributionsCollection?.contributionCalendar || null;
    } catch {
      return null;
    }
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
