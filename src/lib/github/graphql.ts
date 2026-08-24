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
          };
        };
      }>(query, { from, to });

      return data.viewer?.contributionsCollection?.contributionCalendar || null;
    } catch {
      return null;
    }
  }

  public async getBatchRepoOverview(owner: string, repoNames: string[]) {
    if (repoNames.length === 0) return {};

    const fragments = repoNames
      .slice(0, 20)
      .map(
        (name, idx) => `
        repo_${idx}: repository(owner: "${owner}", name: "${name}") {
          name
          stargazerCount
          forkCount
          isPrivate
          isArchived
          diskUsage
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      `
      )
      .join("\n");

    const query = `query { ${fragments} }`;

    try {
      return await this.client.fetchGraphQL<Record<string, unknown>>(query);
    } catch {
      return {};
    }
  }
}
