import type { Category, RawArticle, Source } from "../types";
import { getJson } from "./http";

type DevtoArticle = {
  id: number;
  title: string;
  url: string;
  cover_image: string | null;
  public_reactions_count: number;
  comments_count: number;
  published_at: string;
  tag_list: string[];
};

// Top posts of the last 3 days across all tags (categorize() sorts them by tag), plus tags we
// always want covered even when they don't make the overall top list.
const QUERIES: [string, Category?][] = [
  ["top=3&per_page=100"],
  ["tag=systemdesign&top=7&per_page=15", "system-design"],
  ["tag=devops&top=7&per_page=15", "devops"],
];

export const devto: Source = {
  name: "Dev.to",
  async fetch() {
    const pages = await Promise.all(
      QUERIES.map(async ([query, category]) => {
        const items = await getJson<DevtoArticle[]>(`https://dev.to/api/articles?${query}`);
        return items.map(
          (a): RawArticle => ({
            id: `devto:${a.id}`,
            title: a.title,
            url: a.url,
            source: "Dev.to",
            discussionUrl: `${a.url}#comments`,
            image: a.cover_image ?? undefined,
            points: a.public_reactions_count,
            comments: a.comments_count,
            publishedAt: a.published_at,
            tags: a.tag_list,
            categories: category ? [category] : undefined,
          }),
        );
      }),
    );
    return pages.flat();
  },
};
