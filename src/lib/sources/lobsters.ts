import type { Source } from "../types";
import { getJson } from "./http";

type Story = {
  short_id: string;
  title: string;
  url: string; // "" for text posts
  score: number;
  comment_count: number;
  created_at: string;
  tags: string[];
  comments_url: string;
};

// Lobsters tags (ai, devops, distributed, databases...) feed straight into categorize()'s keyword rules.
export const lobsters: Source = {
  name: "Lobsters",
  async fetch() {
    const pages = await Promise.all([
      getJson<Story[]>("https://lobste.rs/hottest.json"),
      getJson<Story[]>("https://lobste.rs/t/ai,devops,distributed,scaling,databases,programming.json"),
    ]);
    return pages.flat().map((s) => ({
      id: `lobsters:${s.short_id}`,
      title: s.title,
      url: s.url || s.comments_url,
      source: "Lobsters",
      discussionUrl: s.comments_url,
      points: s.score,
      comments: s.comment_count,
      publishedAt: s.created_at,
      tags: s.tags,
    }));
  },
};
