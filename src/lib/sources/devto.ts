import type { Category, RawArticle, Source } from "../types";
import { getJson } from "./http";

type DevtoArticle = {
  id: number;
  title: string;
  url: string;
  public_reactions_count: number;
  comments_count: number;
  published_at: string;
  tag_list: string[];
};

const TAGS: Record<string, Category> = {
  ai: "ai",
  machinelearning: "ai",
  systemdesign: "system-design",
  architecture: "system-design",
  devops: "devops",
  kubernetes: "devops",
  softwareengineering: "engineering",
};

export const devto: Source = {
  name: "Dev.to",
  async fetch() {
    // One request per tag, in parallel. Same article under two tags is merged later by dedupe().
    const perTag = await Promise.all(
      Object.entries(TAGS).map(async ([tag, category]) => {
        const items = await getJson<DevtoArticle[]>(`https://dev.to/api/articles?tag=${tag}&top=7&per_page=10`);
        return items.map(
          (a): RawArticle => ({
            id: `devto:${a.id}`,
            title: a.title,
            url: a.url,
            source: "Dev.to",
            points: a.public_reactions_count,
            comments: a.comments_count,
            publishedAt: a.published_at,
            tags: a.tag_list,
            categories: [category],
          }),
        );
      }),
    );
    return perTag.flat();
  },
};
