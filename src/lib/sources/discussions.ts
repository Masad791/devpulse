// The hottest developer discussions: most-commented threads on HN, Ask HN, Lobsters and Dev.to #discuss.
import { httpUrl, matchTopics } from "../pipeline";
import { getJson } from "./http";

export type Discussion = {
  id: string;
  title: string;
  threadUrl: string; // where the conversation is
  linkUrl?: string; // the article being discussed, if any
  source: string;
  kind: "ask" | "debate";
  comments: number;
  points: number;
  createdAt: string;
};

type HnHit = { objectID: string; title: string; url: string | null; points: number; num_comments: number; created_at: string };

async function hn(): Promise<Discussion[]> {
  const since = Math.floor(Date.now() / 3_600_000) * 3600; // hour-rounded = stable cache key
  const [hot, ask] = await Promise.all([
    getJson<{ hits: HnHit[] }>(
      `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=100&numericFilters=num_comments>=60,created_at_i>${since - 3 * 86_400}`,
    ),
    getJson<{ hits: HnHit[] }>(
      `https://hn.algolia.com/api/v1/search?tags=ask_hn&hitsPerPage=40&numericFilters=num_comments>=10,created_at_i>${since - 7 * 86_400}`,
    ),
  ]);
  const toDiscussion = (h: HnHit, kind: Discussion["kind"]): Discussion => ({
    id: `hn:${h.objectID}`,
    title: h.title,
    threadUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
    linkUrl: httpUrl(h.url ?? undefined),
    source: kind === "ask" ? "Ask HN" : "Hacker News",
    kind,
    comments: h.num_comments,
    points: h.points,
    createdAt: h.created_at,
  });
  return [
    // HN's front page includes politics etc.; keep threads that match one of our tech topics.
    ...hot.hits.filter((h) => !h.title.startsWith("Ask HN") && matchTopics(h.title).length).map((h) => toDiscussion(h, "debate")),
    ...ask.hits.map((h) => toDiscussion(h, "ask")),
  ];
}

type LobstersStory = { short_id: string; title: string; url: string; score: number; comment_count: number; created_at: string; tags: string[]; comments_url: string };

async function lobsters(): Promise<Discussion[]> {
  const [hot, ask] = await Promise.all([
    getJson<LobstersStory[]>("https://lobste.rs/hottest.json"),
    getJson<LobstersStory[]>("https://lobste.rs/t/ask.json"),
  ]);
  return [...hot, ...ask]
    .filter((s) => s.comment_count >= 10)
    .map((s): Discussion => ({
      id: `lobsters:${s.short_id}`,
      title: s.title,
      threadUrl: s.comments_url,
      linkUrl: httpUrl(s.url),
      source: "Lobsters",
      kind: s.tags.includes("ask") ? "ask" : "debate",
      comments: s.comment_count,
      points: s.score,
      createdAt: s.created_at,
    }));
}

type DevtoArticle = { id: number; title: string; url: string; comments_count: number; public_reactions_count: number; published_at: string };

async function devtoDiscuss(): Promise<Discussion[]> {
  const items = await getJson<DevtoArticle[]>("https://dev.to/api/articles?tag=discuss&top=7&per_page=30");
  return items
    .filter((a) => a.comments_count >= 5)
    .map((a): Discussion => ({
      id: `devto:${a.id}`,
      title: a.title,
      threadUrl: `${a.url}#comments`,
      source: "Dev.to #discuss",
      kind: "ask",
      comments: a.comments_count,
      points: a.public_reactions_count,
      createdAt: a.published_at,
    }));
}

export const discussionFetchers = [
  { name: "Hacker News", fetch: hn },
  { name: "Lobsters", fetch: lobsters },
  { name: "Dev.to", fetch: devtoDiscuss },
];
