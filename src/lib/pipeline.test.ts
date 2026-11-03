import { describe, expect, it } from "vitest";
import { categorize, cluster, dropStale, httpUrl, normalizeUrl, paginate, rank, sanitize } from "./pipeline";
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
    expect(a.categories).toEqual(expect.arrayContaining(["system-design", "data", "devops"]));
  });

  it("tags agent skills, but not career skills", () => {
    const topics = (title: string) => categorize([raw({ title: `${title} on Kubernetes` })])[0].categories;
    expect(topics("Claude Motion")).toContain("skills");
    expect(topics("Popular AI Agent Skills")).toContain("skills");
    expect(topics("Agent-Skills.market")).toContain("skills");
    expect(topics("51 SKILL.md workflows")).toContain("skills");
    expect(topics("Soft skills for engineers")).not.toContain("skills");
  });

  it("keeps source hints and drops off-topic items", () => {
    const out = categorize([
      raw({ id: "hint", title: "Weekly roundup", categories: ["ai"] }),
      raw({ id: "offtopic", title: "My favourite sourdough recipe" }),
    ]);
    expect(out.map((a) => a.id)).toEqual(["hint"]);
  });

  it("matches whole words only, including symbol keywords", () => {
    expect(categorize([raw({ title: "How to maintain a garden" })])).toEqual([]);
    expect(categorize([raw({ title: "What's new in C++26" })])).toEqual([]); // "C++26" is not "C++"
    expect(categorize([raw({ title: "Modern C++ tips" })])[0].categories).toContain("languages");
  });
});

describe("sanitize", () => {
  it("only lets http(s) links in", () => {
    expect(httpUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(httpUrl(" JaVaScRiPt:alert(1)")).toBeUndefined();
    expect(httpUrl("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(httpUrl("/relative/path")).toBeUndefined();
    expect(httpUrl(undefined)).toBeUndefined();
  });

  it("drops articles with a bad link and strips bad secondary links", () => {
    const out = sanitize([
      raw({ id: "evil", url: "javascript:alert(1)" }),
      raw({ id: "ok", url: "https://x.com/a", discussionUrl: "data:text/html,hi", image: "javascript:x" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: "ok", discussionUrl: undefined, image: undefined });
  });
});

describe("dropStale", () => {
  it("removes posts older than the window", () => {
    const out = dropStale([raw({ id: "new" }), raw({ id: "old", publishedAt: hoursAgo(24 * 40) })], NOW);
    expect(out.map((a) => a.id)).toEqual(["new"]);
  });
});

describe("cluster", () => {
  it("treats tracking params, www and trailing slash as the same URL", () => {
    expect(normalizeUrl("https://www.Example.com/post/?utm_source=hn#top")).toBe(normalizeUrl("https://example.com/post"));
  });

  it("merges the same link into the most popular copy and lists the others", () => {
    const out = cluster([
      article({ id: "lobsters", source: "Lobsters", url: "https://x.com/a", discussionUrl: "https://lobste.rs/s/1", points: 10, comments: 4 }),
      article({ id: "hn", source: "HN", url: "https://www.x.com/a/", points: 300, categories: ["ai"] }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("hn");
    expect(out[0].related).toEqual([{ source: "Lobsters", url: "https://lobste.rs/s/1", points: 10, comments: 4 }]);
    expect(out[0].categories).toEqual(expect.arrayContaining(["ai", "engineering"]));
  });

  it("merges near-identical titles from different sites", () => {
    const out = cluster([
      article({ id: "a", source: "HN", url: "https://blog.rust-lang.org/2026/10/02/rust-1.99", title: "Announcing Rust 1.99.0", points: 500 }),
      article({ id: "b", source: "Rust Blog", url: "https://blog.rust-lang.org/2026/10/02/Rust-1.99.0.html", title: "Announcing Rust 1.99.0" }),
    ]);
    // titles have < 4 significant words, so only an identical URL could merge these: kept apart on purpose
    expect(out).toHaveLength(2);
    const long = cluster([
      article({ id: "c", source: "HN", url: "https://a.com/1", title: "Postgres 19 adds native vector search and faster vacuum", points: 200 }),
      article({ id: "d", source: "Lobsters", url: "https://b.com/2", title: "Postgres 19 adds native vector search, faster vacuum" }),
    ]);
    expect(long.map((a) => a.id)).toEqual(["c"]);
  });

  it("keeps different stories apart and drops exact duplicates silently", () => {
    const out = cluster([
      article({ id: "x", url: "https://a.com/1", title: "Kubernetes 1.38 release notes and upgrade guide" }),
      article({ id: "y", url: "https://b.com/2", title: "Why we moved off Kubernetes after five years" }),
      article({ id: "x", url: "https://a.com/1", title: "Kubernetes 1.38 release notes and upgrade guide" }),
    ]);
    expect(out.map((a) => a.id).sort()).toEqual(["x", "y"]);
    expect(out.every((a) => !a.related)).toBe(true);
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

describe("paginate", () => {
  const items = Array.from({ length: 65 }, (_, i) =>
    article({ id: String(i), categories: i % 2 ? ["ai"] : ["web"] }),
  );

  it("slices pages and counts them", () => {
    const p3 = paginate(items, [], 3, 30);
    expect(p3).toMatchObject({ page: 3, totalPages: 3, total: 65 });
    expect(p3.articles.map((a) => a.id)).toEqual(["60", "61", "62", "63", "64"]);
  });

  it("filters by any of the given topics", () => {
    expect(paginate(items, ["ai"], 1, 100).total).toBe(32);
    expect(paginate(items, ["ai", "web"], 1, 100).total).toBe(65);
  });

  it("returns an empty page past the end (the route turns that into a 404)", () => {
    expect(paginate(items, [], 9, 30).articles).toEqual([]);
  });

  it("caps pages at MAX_PAGES but reports the real total", () => {
    expect(paginate(items, [], 1, 1)).toMatchObject({ totalPages: 10, total: 65 });
    expect(paginate(items, [], 11, 1).articles).toEqual([]);
  });
});
