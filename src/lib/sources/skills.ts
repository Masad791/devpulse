// Trending agent skills from skills.sh's official leaderboard API. Auth is a Vercel OIDC token (free, no key
// to manage) that only exists on Vercel or after `vercel env pull`, so ingest stores the result for pages to read.
import { httpUrl } from "../pipeline";
import { getJson } from "./http";

export type Skill = { id: string; name: string; source: string; installs: number; url: string };

/** Installing a pack counts for all its skills, so one repo can fill the board: keep only its top few. */
export function topSkills(items: Skill[], limit = 30, perSource = 3): Skill[] {
  const seen = new Map<string, number>();
  return items
    .filter((s) => {
      const n = seen.get(s.source) ?? 0;
      seen.set(s.source, n + 1);
      return n < perSource && httpUrl(s.url);
    })
    .slice(0, limit);
}

export async function trendingSkills(token: string): Promise<Skill[]> {
  const { data } = await getJson<{ data: Skill[] }>("https://skills.sh/api/v1/skills?view=trending&per_page=200", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return topSkills(data);
}
