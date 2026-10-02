// Pure steps of the feed pipeline: categorize -> dedupe -> rank.
// No I/O here, so every step is unit-testable (see pipeline.test.ts).
import type { Article, Category, RawArticle } from "./types";

const RULES: Record<Category, RegExp> = {
  ai: /\b(ai|llms?|gpt\S*|claude|gemini|llama|mistral|deepseek|qwen|openai|anthropic|machine ?learning|ml|deep learning|neural|transformers?|diffusion|rag|agents?|agentic|embeddings?|fine-?tun\w*|inference|hugging ?face|vibecoding|mcp)\b/i,
  "system-design":
    /\b(system design|architecture|distributed|scal(e|ing|ability)|microservices?|databases?|postgres(ql)?|sqlite|sql|redis|kafka|queues?|cach(e|ing)|consensus|raft|shard\w*|replication|load balanc\w*|latency|throughput|event[- ]driven|cdn)\b/i,
  devops:
    /\b(devops|kubernetes|k8s|docker|containers?|terraform|ansible|ci\/cd|ci|observability|monitoring|prometheus|grafana|opentelemetry|sre|incidents?|on-?call|aws|gcp|azure|cloud|serverless|linux|nginx|helm|gitops|deploy\w*|outage|postmortem)\b/i,
  engineering:
    /\b(programming|software|engineering|rust|golang|typescript|javascript|python|java|kotlin|swift|refactor\w*|testing|code review|compilers?|open source|git|api|performance|security|debugging|compsci|practices|web)\b/i,
};

/** Source hints + keyword matches. Articles matching nothing are off-topic and get dropped. */
export function categorize(items: RawArticle[]): Article[] {
  return items.flatMap((item) => {
    const text = `${item.title} ${item.tags.join(" ")}`;
    const matched = (Object.keys(RULES) as Category[]).filter((c) => RULES[c].test(text));
    const categories = [...new Set([...(item.categories ?? []), ...matched])];
    return categories.length ? [{ ...item, categories }] : [];
  });
}

/** Same link posted on HN and Lobsters -> one entry. "https://www.x.com/a/?utm_source=hn" == "https://x.com/a". */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) if (key.startsWith("utm_")) u.searchParams.delete(key);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}${u.search}`.toLowerCase();
  } catch {
    return raw;
  }
}

export function dedupe(items: Article[]): Article[] {
  const best = new Map<string, Article>();
  for (const item of items) {
    const key = normalizeUrl(item.url);
    const seen = best.get(key);
    if (!seen || item.points > seen.points) best.set(key, item);
  }
  return [...best.values()];
}

// Ranking knobs. Tuned by eye against live data — change them and watch the home page.
const HALF_LIFE_HOURS = 24; // a story loses half its score every 24h
const BASELINE = 0.3; // floor so a 0-point story can still surface
const NO_SIGNAL = 0.3; // popularity assumed for sources without points (RSS blogs)
const SAME_SOURCE_DECAY = 0.85; // k-th story from one source is worth 0.85^k: one blog's burst can't flood the top
const SOURCE_WEIGHT: Record<string, number> = { "Dev.to": 0.7 }; // default 1

/**
 * score = (baseline + popularity) * weight * 0.5^(age / half-life), then a same-source penalty.
 * Popularity is the story's percentile *within its own source* (0..1),
 * because 100 HN points and 100 Dev.to reactions mean different things.
 */
export function rank(items: Article[], now = Date.now()): Article[] {
  const pointsBySource = new Map<string, number[]>();
  for (const item of items) {
    const list = pointsBySource.get(item.source) ?? [];
    list.push(item.points);
    pointsBySource.set(item.source, list);
  }
  for (const list of pointsBySource.values()) list.sort((a, b) => a - b);

  const popularity = (item: Article) => {
    const list = pointsBySource.get(item.source)!;
    if (list.at(-1) === 0) return NO_SIGNAL;
    return list.length > 1 ? list.indexOf(item.points) / (list.length - 1) : 1;
  };

  const scored = items
    .map((item) => {
      const ageHours = Math.max(0, (now - Date.parse(item.publishedAt)) / 3_600_000);
      const s = (BASELINE + popularity(item)) * (SOURCE_WEIGHT[item.source] ?? 1) * 0.5 ** (ageHours / HALF_LIFE_HOURS);
      return { item, s };
    })
    .sort((a, b) => b.s - a.s);

  const seen = new Map<string, number>();
  for (const entry of scored) {
    const k = seen.get(entry.item.source) ?? 0;
    entry.s *= SAME_SOURCE_DECAY ** k;
    seen.set(entry.item.source, k + 1);
  }
  return scored.sort((a, b) => b.s - a.s).map(({ item }) => item);
}
