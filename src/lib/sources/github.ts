// GitHub search: trending repos by category + issues to contribute to.
// GitHub has no "trending" API, so trending = repos created recently, sorted by stars (new & rising),
// or repos pushed this week sorted by stars (popular & active).
// Rate limit: 10 searches/min without a token, 30 with GITHUB_TOKEN — every query is cached, and
// production should set the token.
import { getJson } from "./http";

const headers = () => {
  const token = process.env.GITHUB_TOKEN;
  return { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

// ---------- Repos ----------

/** Each category is one or more search queries (GitHub search can't OR two topics, so we merge). */
export const REPO_CATEGORIES = {
  all: { label: "Everything", queries: ["stars:>20"] },
  claude: { label: "Claude & agent skills", queries: ["topic:claude-code", "topic:agent-skills"] },
  "ai-agents": { label: "AI agents", queries: ["topic:ai-agents"] },
  mcp: { label: "MCP servers", queries: ["topic:mcp-server"] },
  llm: { label: "LLM apps", queries: ["topic:llm"] },
  "self-hosted": { label: "Self-hosted & free alternatives", queries: ["topic:self-hosted"] },
  devtools: { label: "Developer tools", queries: ["topic:developer-tools", "topic:cli"] },
  devops: { label: "DevOps & infra", queries: ["topic:devops", "topic:kubernetes"] },
  web: { label: "Web & frontend", queries: ["topic:frontend", "topic:react"] },
  learn: { label: "Learning & awesome lists", queries: ["topic:awesome-list", "topic:system-design"] },
} as const;
export type RepoCategory = keyof typeof REPO_CATEGORIES;

export const REPO_PERIODS = {
  week: { label: "New this week", qualifier: () => `created:>${daysAgo(7)}` },
  month: { label: "New this month", qualifier: () => `created:>${daysAgo(30)}` },
  active: { label: "Popular & active", qualifier: () => `pushed:>${daysAgo(7)}` },
} as const;
export type RepoPeriod = keyof typeof REPO_PERIODS;

export const LANGUAGES = ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C#", "C++", "PHP", "Ruby", "Kotlin", "Swift", "Dart", "Shell"];

export type Repo = {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  createdAt: string;
  pushedAt: string;
};

type ApiRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics?: string[];
  created_at: string;
  pushed_at: string;
};

export async function searchRepos(category: RepoCategory, period: RepoPeriod, language?: string, perQuery = 30): Promise<Repo[]> {
  const extra = [REPO_PERIODS[period].qualifier(), language ? `language:"${language}"` : ""].join(" ");
  const pages = await Promise.all(
    REPO_CATEGORIES[category].queries.map((q) =>
      getJson<{ items: ApiRepo[] }>(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(`${q} ${extra} archived:false`)}&sort=stars&order=desc&per_page=${perQuery}`,
        { headers: headers(), revalidate: 3600 },
      ),
    ),
  );
  const unique = new Map(pages.flatMap((p) => p.items).map((r) => [r.full_name, r]));
  return [...unique.values()]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .map((r) => ({
      name: r.full_name,
      url: r.html_url,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      openIssues: r.open_issues_count,
      topics: r.topics ?? [],
      createdAt: r.created_at,
      pushedAt: r.pushed_at,
    }));
}

// ---------- Issues ----------

export const ISSUE_LABELS = {
  beginner: { label: "Any beginner label", query: `"good first issue","good-first-issue","first-timers-only","beginner","easy"` },
  "good-first-issue": { label: "good first issue", query: `"good first issue"` },
  "help-wanted": { label: "help wanted", query: `"help wanted"` },
  hacktoberfest: { label: "hacktoberfest", query: "hacktoberfest" },
  documentation: { label: "documentation", query: "documentation" },
  "up-for-grabs": { label: "up-for-grabs", query: "up-for-grabs" },
  bug: { label: "bug", query: "bug" },
  enhancement: { label: "enhancement", query: "enhancement" },
} as const;
export type IssueLabel = keyof typeof ISSUE_LABELS;

export const ISSUE_SORTS = {
  updated: "Recently active",
  created: "Newest",
  comments: "Most discussed",
} as const;
export type IssueSort = keyof typeof ISSUE_SORTS;

export type IssueFilters = {
  label: IssueLabel;
  language?: string;
  repo?: string; // "owner/name"
  keyword?: string;
  unassigned: boolean;
  sort: IssueSort;
  page: number;
};

export type Issue = {
  title: string;
  url: string;
  repo: string;
  labels: { name: string; color: string }[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  author: string;
};

type ApiIssue = {
  title: string;
  html_url: string;
  repository_url: string;
  labels: { name: string; color: string }[];
  comments: number;
  created_at: string;
  updated_at: string;
  user: { login: string } | null;
};

/** Builds the GitHub search query. Exported for tests: user input must never break out of its qualifier. */
export function issueQuery(f: IssueFilters): string {
  const clean = (s: string) => s.replace(/["\\]/g, "").trim();
  return [
    "is:issue is:open archived:false",
    `label:${ISSUE_LABELS[f.label].query}`,
    f.language && `language:"${clean(f.language)}"`,
    f.repo && /^[\w.-]+\/[\w.-]+$/.test(f.repo) && `repo:${f.repo}`,
    f.unassigned && "no:assignee",
    f.keyword && `"${clean(f.keyword).slice(0, 60)}"`,
  ]
    .filter(Boolean)
    .join(" ");
}

export const ISSUES_PER_PAGE = 30;

export async function searchIssues(f: IssueFilters): Promise<{ total: number; issues: Issue[] }> {
  const res = await getJson<{ total_count: number; items: ApiIssue[] }>(
    `https://api.github.com/search/issues?q=${encodeURIComponent(issueQuery(f))}&sort=${f.sort}&order=desc&per_page=${ISSUES_PER_PAGE}&page=${f.page}`,
    { headers: headers(), revalidate: 600 },
  );
  return {
    total: res.total_count,
    issues: res.items.map((i) => ({
      title: i.title,
      url: i.html_url,
      repo: i.repository_url.split("/").slice(-2).join("/"),
      labels: i.labels.map((l) => ({ name: l.name, color: l.color })),
      comments: i.comments,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      author: i.user?.login ?? "ghost",
    })),
  };
}

/** GitHub answers 403/429 when the search rate limit is hit. */
export const isRateLimit = (e: unknown) => /\b(403|429)\b/.test(String(e));
