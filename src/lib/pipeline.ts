// Pure steps of the feed pipeline: categorize -> dedupe -> rank -> paginate.
// No I/O here, so every step is unit-testable (see pipeline.test.ts).
import type { Article, Category, RawArticle } from "./types";

// Keywords per topic, matched against title + tags as whole words ("ai" won't match "maintain").
// Each entry is a regex fragment. Add a keyword here and the topic page picks it up on the next refresh.
const KEYWORDS: Record<Category, string[]> = {
  ai: ["ai", "llms?", "gpt\\S*", "chatgpt", "claude", "gemini", "llama", "mistral", "deepseek", "qwen", "openai", "anthropic", "machine ?learning", "machinelearning", "ml", "deep learning", "neural", "transformers?", "diffusion", "rag", "agents?", "agentic", "embeddings?", "fine-?tun\\w*", "inference", "hugging ?face", "pytorch", "ollama", "copilot", "vibecoding", "mcp", "papers?"],
  "system-design": ["system ?design", "systemdesign", "architecture", "distributed", "scal(e|ing|ability)", "microservices?", "queues?", "cach(e|ing)", "consensus", "raft", "paxos", "shard\\w*", "replication", "load balanc\\w*", "latency", "throughput", "event[- ]driven", "cdn", "high availability", "rate limit\\w*"],
  devops: ["devops", "kubernetes", "k8s", "docker", "containers?", "terraform", "ansible", "ci/cd", "ci", "observability", "monitoring", "prometheus", "grafana", "opentelemetry", "sre", "incidents?", "on-?call", "helm", "gitops", "deploy\\w*", "outage", "postmortem", "platform engineering", "linux", "nginx"],
  cloud: ["cloud", "aws", "gcp", "google cloud", "azure", "serverless", "lambda", "s3", "ec2", "cloudflare", "vercel", "netlify"],
  web: ["web", "webdev", "frontend", "front-end", "css", "html", "javascript", "typescript", "react", "vue", "svelte", "angular", "next\\.?js", "node\\.?js", "deno", "bun", "browsers?", "chrome", "firefox", "safari", "webassembly", "wasm", "tailwind"],
  data: ["databases?", "postgres(ql)?", "mysql", "sqlite", "sql", "redis", "kafka", "mongodb", "clickhouse", "duckdb", "data engineering", "analytics", "etl", "warehouse", "spark"],
  security: ["security", "cybersecurity", "vulnerabilit\\w*", "cve-?[\\d-]*", "exploits?", "malware", "ransomware", "breach\\w*", "phishing", "zero-day", "0day", "oauth", "encryption", "cryptography", "infosec", "backdoor", "supply chain attack", "hacked"],
  languages: ["rust", "golang", "go \\d[\\d.]*", "python", "java", "kotlin", "swift", "c\\+\\+", "zig", "elixir", "haskell", "ocaml", "ruby", "php", "scala", "c#", "\\.net", "dotnet", "compilers?", "programming languages?"],
  mobile: ["android", "ios", "iphone", "swiftui", "flutter", "react native", "mobile", "xcode", "jetpack compose"],
  "open-source": ["open ?source", "open-source", "oss", "foss", "maintainers?", "licen[cs]e", "forks?", "github"],
  career: ["careers?", "hiring", "interviews?", "layoffs?", "salar(y|ies)", "remote work", "managers?", "management", "leadership", "staff engineer", "promotion", "burnout", "jobs?", "junior", "mentor\\w*"],
  engineering: ["programming", "software", "engineering", "refactor\\w*", "testing", "tdd", "code review", "debugging", "performance", "compsci", "practices", "api", "clean code", "design patterns", "technical debt", "tech debt", "git"],
};

// (?<!\w)...(?!\w) instead of \b so keywords like "c++" and "c#" still match.
const RULES = Object.fromEntries(
  Object.entries(KEYWORDS).map(([c, words]) => [c, new RegExp(`(?<![\\w])(${words.join("|")})(?![\\w])`, "i")]),
) as Record<Category, RegExp>;

export const matchTopics = (text: string) => (Object.keys(RULES) as Category[]).filter((c) => RULES[c].test(text));

/** Source hints + keyword matches. Articles matching nothing are off-topic and get dropped. */
export function categorize(items: RawArticle[]): Article[] {
  return items.flatMap((item) => {
    const matched = matchTopics(`${item.title} ${item.tags.join(" ")}`);
    const categories = [...new Set([...(item.categories ?? []), ...matched])];
    return categories.length ? [{ ...item, categories }] : [];
  });
}

/** Low-frequency blogs keep months of posts in their feeds; a news feed only wants recent ones. */
export const dropStale = <T extends { publishedAt: string }>(items: T[], now = Date.now(), maxDays = 30) =>
  items.filter((item) => now - Date.parse(item.publishedAt) < maxDays * 86_400_000);

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

export const PAGE_SIZE = 30;
export const MAX_PAGES = 10; // nobody reads page 11 of a news feed; also bounds how many pages ISR caches

/** Filter by topics (any match), then slice one page. Page numbers start at 1. */
export function paginate(all: Article[], topics: Category[], page: number, size = PAGE_SIZE) {
  const matching = topics.length ? all.filter((a) => a.categories.some((c) => topics.includes(c))) : all;
  const totalPages = Math.max(1, Math.min(Math.ceil(matching.length / size), MAX_PAGES));
  const articles = page <= totalPages ? matching.slice((page - 1) * size, page * size) : [];
  return { articles, page, totalPages, total: matching.length };
}
