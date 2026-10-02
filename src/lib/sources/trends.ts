import type { Trend } from "../types";
import { getJson } from "./http";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

type HfModel = { id: string; likes: number; downloads: number; pipeline_tag?: string };

export async function trendingModels(): Promise<Trend[]> {
  const models = await getJson<HfModel[]>("https://huggingface.co/api/models?sort=trendingScore&limit=8");
  return models.map((m) => ({
    title: m.id,
    url: `https://huggingface.co/${m.id}`,
    description: m.pipeline_tag?.replaceAll("-", " "),
    stat: `♥ ${compact.format(m.likes)}`,
  }));
}

type Repo = { full_name: string; html_url: string; description: string | null; stargazers_count: number; language: string | null };

/** New repos (last 7 days) by stars. Unauthenticated search allows 10 req/min — fine behind the 15 min cache. */
export async function risingRepos(): Promise<Trend[]> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const token = process.env.GITHUB_TOKEN; // optional: raises the rate limit
  const { items } = await getJson<{ items: Repo[] }>(
    `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=8`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  return items.map((r) => ({
    title: r.full_name,
    url: r.html_url,
    description: r.description ?? r.language ?? undefined,
    stat: `★ ${compact.format(r.stargazers_count)}`,
  }));
}
