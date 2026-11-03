// Release radar: the latest release of tools developers care about, from GitHub's free per-repo Atom feeds
// (github.com/<owner>/<repo>/releases.atom — no API key, no search rate limit).
import { XMLParser } from "fast-xml-parser";
import { allSettledPool } from "../pool";
import { getText } from "./http";

type Watch = { repo: string; group: string; match?: RegExp }; // `match`: only tags that look like real releases

export const WATCHED: Watch[] = [
  { repo: "vercel/next.js", group: "Web" },
  { repo: "react/react", group: "Web" },
  { repo: "vitejs/vite", group: "Web" },
  { repo: "sveltejs/svelte", group: "Web" },
  { repo: "vuejs/core", group: "Web" },
  { repo: "tailwindlabs/tailwindcss", group: "Web" },
  { repo: "nodejs/node", group: "Runtimes & languages" },
  { repo: "denoland/deno", group: "Runtimes & languages" },
  { repo: "oven-sh/bun", group: "Runtimes & languages" },
  { repo: "microsoft/TypeScript", group: "Runtimes & languages", match: /^TypeScript/i },
  { repo: "rust-lang/rust", group: "Runtimes & languages" },
  { repo: "golang/go", group: "Runtimes & languages" },
  { repo: "python/cpython", group: "Runtimes & languages" },
  { repo: "JetBrains/kotlin", group: "Runtimes & languages", match: /^Kotlin/i },
  { repo: "anthropics/claude-code", group: "AI tools" },
  { repo: "openai/codex", group: "AI tools" },
  { repo: "ollama/ollama", group: "AI tools" },
  { repo: "huggingface/transformers", group: "AI tools" },
  { repo: "vllm-project/vllm", group: "AI tools", match: /^v\d/ },
  { repo: "langchain-ai/langchain", group: "AI tools", match: /^langchain==/ },
  { repo: "kubernetes/kubernetes", group: "Infra & DevOps" },
  { repo: "docker/compose", group: "Infra & DevOps" },
  { repo: "hashicorp/terraform", group: "Infra & DevOps" },
  { repo: "opentofu/opentofu", group: "Infra & DevOps" },
  { repo: "helm/helm", group: "Infra & DevOps" },
  { repo: "argoproj/argo-cd", group: "Infra & DevOps" },
  { repo: "traefik/traefik", group: "Infra & DevOps" },
  { repo: "grafana/grafana", group: "Infra & DevOps" },
  { repo: "prometheus/prometheus", group: "Infra & DevOps" },
  { repo: "duckdb/duckdb", group: "Data" },
  { repo: "ClickHouse/ClickHouse", group: "Data" },
  { repo: "prisma/orm", group: "Data" },
  { repo: "drizzle-team/drizzle-orm", group: "Data" },
  { repo: "astral-sh/uv", group: "Dev tools" },
  { repo: "astral-sh/ruff", group: "Dev tools" },
  { repo: "pnpm/pnpm", group: "Dev tools" },
  { repo: "microsoft/vscode", group: "Dev tools" },
  { repo: "neovim/neovim", group: "Dev tools" },
  { repo: "zed-industries/zed", group: "Dev tools" },
  { repo: "tauri-apps/tauri", group: "Dev tools" },
  { repo: "electron/electron", group: "Dev tools" },
  { repo: "flutter/flutter", group: "Dev tools" },
];

// Last alternative: PEP 440 style glued suffixes, e.g. "0.31.1rc0", "2.0a1", "3.1b2".
const PRERELEASE = /(canary|nightly|alpha|beta|preview|snapshot|insiders|[-.]rc\.?\d*|\brc\d*\b|[-.]dev\b|-dev[-.]|\bdev\d|\d(?:a|b|rc)\d+\b)/i;
export const isPrerelease = (tag: string) => PRERELEASE.test(tag);

/** "[release-branch.go1.27] go1.27.2" -> "go1.27.2"; "v0.31.1: [Metrics] Expose…" -> "v0.31.1" */
export const cleanTag = (title: string) =>
  title
    .replace(/^\[[^\]]*\]\s*/, "")
    .replace(/^(v?\d[\w.+-]*):\s.*$/, "$1")
    .trim();

export type Release = { repo: string; group: string; tag: string; url: string; date: string; prerelease: boolean };

const parser = new XMLParser({ ignoreAttributes: false, isArray: (name) => name === "entry" });
type Entry = { title: string | { "#text": string }; updated: string; link?: { "@_href": string } };

/** Latest stable release per repo (or the latest pre-release, flagged, when the feed holds nothing stable). */
// Feeds with long release notes (transformers, vllm…) take 10–30 s to generate. Pages never wait for this:
// with a database the ingest job (background, generous timeout) stores the results.
export async function latestReleases(timeoutMs = 20_000): Promise<Release[]> {
  const results = await allSettledPool(
    WATCHED.map((w) => async (): Promise<Release | null> => {
      const xml = await getText(`https://github.com/${w.repo}/releases.atom`, { revalidate: 3600, timeoutMs });
      const entries: Entry[] = parser.parse(xml).feed?.entry ?? [];
      const releases = entries
        .map((e) => ({
          tag: cleanTag(typeof e.title === "string" ? e.title : e.title["#text"]),
          url: e.link?.["@_href"] ?? "",
          date: e.updated,
        }))
        .filter((r) => r.url.startsWith("https://github.com/") && (!w.match || w.match.test(r.tag)));
      const pick = releases.find((r) => !isPrerelease(r.tag)) ?? releases[0];
      return pick ? { repo: w.repo, group: w.group, ...pick, prerelease: isPrerelease(pick.tag) } : null;
    }),
    10,
  );
  results.forEach((r, i) => r.status === "rejected" && console.error(`[releases] ${WATCHED[i].repo} failed:`, r.reason));
  return results
    .flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : []))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
