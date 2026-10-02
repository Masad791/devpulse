import { describe, expect, it } from "vitest";
import { categorize, dedupe, normalizeUrl, rank } from "./pipeline";
import type { Article, RawArticle } from "./types";

const NOW = Date.parse("2026-10-02T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

const raw = (over: Partial<RawArticle>): RawArticle => ({
  id: "x",
  title: "",
  url: "https://example.com",
  source: "HN",
  points: 0,
  comments: 0,
  publishedAt: hoursAgo(1),
  tags: [],
  ...over,
});
const article = (over: Partial<Article>): Article => ({ ...raw(over), categories: ["engineering"], ...over });

describe("categorize", () => {
  it("matches keywords in title and tags", () => {
    const [a] = categorize([raw({ title: "Scaling Postgres with Kubernetes" })]);
    expect(a.categories).toEqual(expect.arrayContaining(["system-design", "devops"]));
  });

  it("keeps source hints and drops off-topic items", () => {
    const out = categorize([
      raw({ id: "hint", title: "Weekly roundup", categories: ["ai"] }),
      raw({ id: "offtopic", title: "My favourite sourdough recipe" }),
    ]);
    expect(out.map((a) => a.id)).toEqual(["hint"]);
  });

  it("does not match substrings (\"maintain\" is not AI)", () => {
    expect(categorize([raw({ title: "How to maintain a garden" })])).toEqual([]);
  });
});

describe("dedupe", () => {
  it("treats tracking params, www and trailing slash as the same URL", () => {
    expect(normalizeUrl("https://www.Example.com/post/?utm_source=hn#top")).toBe(
      normalizeUrl("https://example.com/post"),
    );
  });

  it("keeps the more popular copy", () => {
    const out = dedupe([
      article({ id: "lobsters", url: "https://x.com/a", points: 10 }),
      article({ id: "hn", url: "https://www.x.com/a/", points: 300 }),
    ]);
    expect(out.map((a) => a.id)).toEqual(["hn"]);
  });
});

describe("rank", () => {
  it("lets a fresh story beat a 3-day-old one with more points", () => {
    const out = rank(
      [
        article({ id: "old", points: 500, publishedAt: hoursAgo(72) }),
        article({ id: "fresh", points: 100, publishedAt: hoursAgo(1) }),
      ],
      NOW,
    );
    expect(out[0].id).toBe("fresh");
  });

  it("stops a burst from one blog taking over the top", () => {
    const burst = [1, 2, 3, 4, 5].map((n) => article({ id: `blog${n}`, source: "Blog", publishedAt: hoursAgo(0.5) }));
    const hn = article({ id: "hn", points: 300, publishedAt: hoursAgo(30) }); // scores just below one blog post
    const top3 = rank([...burst, hn], NOW).slice(0, 3);
    expect(top3.map((a) => a.id)).toContain("hn"); // without the same-source penalty it would be 6th
  });

  it("normalizes per source so big-number sources do not dominate", () => {
    const out = rank(
      [
        article({ id: "hn-mid", source: "HN", points: 50 }),
        article({ id: "hn-top", source: "HN", points: 900 }),
        article({ id: "devto-top", source: "Dev.to", points: 40 }),
      ],
      NOW,
    );
    expect(out.map((a) => a.id).slice(0, 2).sort()).toEqual(["devto-top", "hn-top"]);
  });
});
