import type { Source } from "../types";
import { getJson } from "./http";

type DailyPaper = {
  paper: { id: string; upvotes: number };
  title: string;
  publishedAt: string;
  thumbnail?: string;
  numComments: number;
};

// Hugging Face "Daily Papers": the AI research papers the community upvoted today.
export const hfPapers: Source = {
  name: "HF Papers",
  async fetch() {
    const papers = await getJson<DailyPaper[]>("https://huggingface.co/api/daily_papers?limit=30");
    return papers.map((p) => ({
      id: `hf-papers:${p.paper.id}`,
      title: p.title,
      url: `https://huggingface.co/papers/${p.paper.id}`,
      source: "HF Papers",
      discussionUrl: `https://huggingface.co/papers/${p.paper.id}#community`,
      image: p.thumbnail,
      points: p.paper.upvotes,
      comments: p.numComments,
      publishedAt: p.publishedAt,
      tags: ["paper"],
      categories: ["ai"],
    }));
  },
};
