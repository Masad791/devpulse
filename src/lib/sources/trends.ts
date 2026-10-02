import { count } from "../format";
import type { Trend } from "../types";
import { searchRepos } from "./github";
import { getJson } from "./http";

type HfModel = { id: string; likes: number; downloads: number; pipeline_tag?: string };

export async function trendingModels(): Promise<Trend[]> {
  const models = await getJson<HfModel[]>("https://huggingface.co/api/models?sort=trendingScore&limit=8");
  return models.map((m) => ({
    title: m.id,
    url: `https://huggingface.co/${m.id}`,
    description: m.pipeline_tag?.replaceAll("-", " "),
    stat: `♥ ${count(m.likes)}`,
  }));
}

export async function risingRepos(): Promise<Trend[]> {
  const repos = await searchRepos("all", "week", undefined, 8);
  return repos.map((r) => ({
    title: r.name,
    url: r.url,
    description: r.description ?? r.language ?? undefined,
    stat: `★ ${count(r.stars)}`,
  }));
}
