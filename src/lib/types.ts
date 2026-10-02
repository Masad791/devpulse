export const CATEGORIES = {
  ai: "AI & Models",
  "system-design": "System Design",
  devops: "DevOps & Cloud",
  engineering: "Engineering",
} as const;

export type Category = keyof typeof CATEGORIES;

export const isCategory = (value: unknown): value is Category =>
  typeof value === "string" && Object.hasOwn(CATEGORIES, value);

/** What every source adapter returns: one shape, whatever the upstream API looks like. */
export type RawArticle = {
  id: string; // `${source}:${upstream id}`, stable across fetches
  title: string;
  url: string;
  source: string;
  discussionUrl?: string;
  points: number; // upstream popularity; 0 when the source has none (RSS)
  comments: number;
  publishedAt: string; // ISO 8601
  tags: string[];
  categories?: Category[]; // hints from the source (e.g. a feed that is always DevOps)
};

export type Article = RawArticle & { categories: Category[] };

export type Source = {
  name: string;
  fetch: () => Promise<RawArticle[]>;
};

export type SourceStatus = { name: string; ok: boolean; count: number; error?: string };

/** Sidebar items (trending models, rising repos) — not articles, so not ranked with them. */
export type Trend = { title: string; url: string; description?: string; stat: string };
