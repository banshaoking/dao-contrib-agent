import { GitHubPR, GitHubCommit, GitHubReview } from "../types";

const GITHUB_API = "https://api.github.com";

export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetch(endpoint: string): Promise<any> {
    const response = await fetch(`${GITHUB_API}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取仓库的 Pull Requests
   */
  async getPullRequests(
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "all",
    since?: string
  ): Promise<GitHubPR[]> {
    let endpoint = `/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`;
    if (since) {
      endpoint += `&since=${since}`;
    }
    return this.fetch(endpoint);
  }

  /**
   * 获取仓库的 Commits
   */
  async getCommits(
    owner: string,
    repo: string,
    since?: string,
    author?: string
  ): Promise<GitHubCommit[]> {
    let endpoint = `/repos/${owner}/${repo}/commits?per_page=100`;
    if (since) endpoint += `&since=${since}`;
    if (author) endpoint += `&author=${author}`;
    return this.fetch(endpoint);
  }

  /**
   * 获取 PR 的 Reviews
   */
  async getPullRequestReviews(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<GitHubReview[]> {
    return this.fetch(`/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`);
  }

  /**
   * 获取用户的贡献统计
   */
  async getUserContributions(
    owner: string,
    repo: string,
    username: string,
    since?: string
  ) {
    const [prs, commits] = await Promise.all([
      this.getPullRequests(owner, repo, "all", since),
      this.getCommits(owner, repo, since, username),
    ]);

    const userPRs = prs.filter((pr) => pr.user.login === username);
    const mergedPRs = userPRs.filter((pr) => pr.merged_at !== null);

    return {
      username,
      totalPRs: userPRs.length,
      mergedPRs: mergedPRs.length,
      totalCommits: commits.length,
      totalAdditions: userPRs.reduce((sum, pr) => sum + pr.additions, 0),
      totalDeletions: userPRs.reduce((sum, pr) => sum + pr.deletions, 0),
      pullRequests: userPRs,
      commits: commits,
    };
  }

  /**
   * 将 GitHub 贡献转换为内部格式
   */
  convertToContributions(
    owner: string,
    repo: string,
    username: string,
    address: string,
    data: Awaited<ReturnType<typeof this.getUserContributions>>
  ) {
    const contributions: any[] = [];

    // 转换 PRs
    data.pullRequests.forEach((pr) => {
      contributions.push({
        contributorAddress: address,
        contributorGithub: username,
        platform: "github",
        type: "pull_request",
        externalId: `${owner}/${repo}/pr/${pr.number}`,
        title: pr.title,
        url: pr.html_url,
        metadata: {
          state: pr.state,
          merged: pr.merged_at !== null,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
        },
        timestamp: new Date(pr.created_at).getTime(),
      });
    });

    // 转换 Commits
    data.commits.forEach((commit) => {
      contributions.push({
        contributorAddress: address,
        contributorGithub: username,
        platform: "github",
        type: "commit",
        externalId: `${owner}/${repo}/commit/${commit.sha}`,
        title: commit.commit.message.split("\n")[0],
        url: commit.html_url,
        metadata: {
          sha: commit.sha,
          author: commit.commit.author.name,
        },
        timestamp: new Date(commit.commit.author.date).getTime(),
      });
    });

    return contributions;
  }
}

export const createGitHubService = () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }
  return new GitHubService(token);
};
