import type { Source } from "../types";
import { getJson } from "./http";

type Hit = {
  objectID: string;
  title: string;
  url: string | null;
  points: number;
  num_comments: number;
  created_at: string;
};

// Algolia's free HN search API. Popular stories from the last 3 days; off-topic ones are dropped by categorize().
export const hackerNews: Source = {
  name: "Hacker News",
  async fetch() {
    // Round to the hour so the URL (= cache key) is stable between revalidations.
    const since = Math.floor(Date.now() / 3_600_000) * 3600 - 3 * 86_400;
    const { hits } = await getJson<{ hits: Hit[] }>(
      `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=100&numericFilters=points>=40,created_at_i>${since}`,
    );
    return hits.map((h) => {
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
    });
  },
};
