// Trend radar: how often tracked technologies show up in titles, per day, this week vs last week. Pure.

// Each pattern is a regex fragment matched as whole words (same rule as topic keywords).
export const TRACKED: { label: string; pattern: string }[] = [
  { label: "LLMs", pattern: "llms?" },
  { label: "AI agents", pattern: "agents?|agentic" },
  { label: "MCP", pattern: "mcp|model context protocol" },
  { label: "RAG", pattern: "rag" },
  { label: "Claude", pattern: "claude" },
  { label: "OpenAI / GPT", pattern: "openai|chatgpt|gpt\\S*" },
  { label: "Gemini", pattern: "gemini" },
  { label: "Llama", pattern: "llama" },
  { label: "DeepSeek", pattern: "deepseek" },
  { label: "Qwen", pattern: "qwen" },
  { label: "Rust", pattern: "rust" },
  { label: "Go", pattern: "golang|go \\d[\\d.]*" },
  { label: "Python", pattern: "python" },
  { label: "TypeScript", pattern: "typescript" },
  { label: "JavaScript", pattern: "javascript" },
  { label: "Zig", pattern: "zig" },
  { label: "Java", pattern: "java|jvm" },
  { label: "C++", pattern: "c\\+\\+" },
  { label: "WebAssembly", pattern: "webassembly|wasm" },
  { label: "React", pattern: "react" },
  { label: "Next.js", pattern: "next\\.?js" },
  { label: "Svelte", pattern: "svelte" },
  { label: "Bun", pattern: "bun" },
  { label: "Deno", pattern: "deno" },
  { label: "Node.js", pattern: "node\\.?js" },
  { label: "Kubernetes", pattern: "kubernetes|k8s" },
  { label: "Docker", pattern: "docker" },
  { label: "Terraform", pattern: "terraform|opentofu" },
  { label: "AWS", pattern: "aws" },
  { label: "Cloudflare", pattern: "cloudflare" },
  { label: "Linux", pattern: "linux" },
  { label: "Observability", pattern: "observability|opentelemetry" },
  { label: "Postgres", pattern: "postgres(ql)?" },
  { label: "SQLite", pattern: "sqlite" },
  { label: "Redis", pattern: "redis|valkey" },
  { label: "Kafka", pattern: "kafka" },
  { label: "DuckDB", pattern: "duckdb" },
  { label: "Vulnerabilities", pattern: "vulnerabilit\\w*|cve-?[\\d-]*|exploits?|zero-day" },
  { label: "Supply chain", pattern: "supply.chain" },
  { label: "Open source", pattern: "open.source" },
  { label: "Layoffs", pattern: "layoffs?" },
  { label: "Hiring", pattern: "hiring|interviews?" },
];

const RULES = TRACKED.map((t) => ({ label: t.label, re: new RegExp(`(?<![\\w])(${t.pattern})(?![\\w])`, "i") }));
const DAY = 86_400_000;

export type TermTrend = { label: string; daily: number[]; thisWeek: number; lastWeek: number; change: number | null };

const MIN_BASELINE = 3; // fewer mentions than this last week = too little data for a meaningful %

/**
 * daily[0] is the oldest day, daily[days-1] is today (UTC).
 * `change` compares SHARE of mentions (term count / all stories that week), not raw counts: if this week simply
 * has more stories (more sources, or HN only returning its last 3 days), raw counts would all "rise" together.
 * null when last week had fewer than MIN_BASELINE mentions.
 */
export function computeTrends(items: { title: string; tags: string[]; publishedAt: string }[], now = Date.now(), days = 28): TermTrend[] {
  const today = Math.floor(now / DAY);
  const counts = RULES.map(() => new Array<number>(days).fill(0));
  const totals = new Array<number>(days).fill(0);
  for (const item of items) {
    const index = days - 1 - (today - Math.floor(Date.parse(item.publishedAt) / DAY));
    if (index < 0 || index >= days) continue;
    totals[index]++;
    const text = `${item.title} ${item.tags.join(" ")}`;
    RULES.forEach((rule, i) => rule.re.test(text) && counts[i][index]++);
  }
  const sum = (list: number[], from: number, to: number) => list.slice(from, to).reduce((a, b) => a + b, 0);
  const totalThis = sum(totals, days - 7, days);
  const totalLast = sum(totals, days - 14, days - 7);

  return RULES.map((rule, i) => {
    const daily = counts[i];
    const thisWeek = sum(daily, days - 7, days);
    const lastWeek = sum(daily, days - 14, days - 7);
    const change = lastWeek >= MIN_BASELINE && totalThis > 0 ? thisWeek / totalThis / (lastWeek / totalLast) - 1 : null;
    return { label: rule.label, daily, thisWeek, lastWeek, change };
  });
}
