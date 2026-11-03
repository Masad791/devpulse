import type { RawArticle, Source } from "../types";
import { getJson } from "./http";

type Hit = {
  objectID: string;
  title: string;
  url: string | null;
  points: number;
  num_comments: number;
  created_at: string;
};

// Rounded to the hour so the URL (= cache key) is stable between revalidations.
const sinceDays = (days: number) => Math.floor(Date.now() / 3_600_000) * 3600 - days * 86_400;

function toArticle(h: Hit): RawArticle {
  const discussionUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
  return {
    id: `hn:${h.objectID}`,
    title: h.title,
    url: h.url ?? discussionUrl,
    source: "Hacker News",
    discussionUrl,
    points: h.points,
    comments: h.num_comments,
    publishedAt: h.created_at,
    tags: [],
  };
}

// Algolia's free HN search API. Popular stories from the last 3 days; off-topic ones are dropped by categorize().
export const hackerNews: Source = {
  name: "Hacker News",
  async fetch() {
    const { hits } = await getJson<{ hits: Hit[] }>(
      `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=100&numericFilters=points>=40,created_at_i>${sinceDays(3)}`,
    );
    return hits.map(toArticle);
  },
};

// Skill stories rarely reach 40 points, so this niche gets its own low bar. Titles only: "skills" in a post body means nothing.
const SKILL_QUERIES = ['"claude skills"', '"agent skills"', '"claude motion"', '"skill.md"'];

export const hnSkills: Source = {
  name: "HN Skills",
  async fetch() {
    const pages = await Promise.all(
      SKILL_QUERIES.map((q) =>
        getJson<{ hits: Hit[] }>(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&restrictSearchableAttributes=title&hitsPerPage=20&numericFilters=points>=2,created_at_i>${sinceDays(30)}`,
        ),
      ),
    );
    return pages.flatMap((p) => p.hits).map(toArticle);
  },
};
