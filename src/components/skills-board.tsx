import Link from "next/link";
import { getSkills } from "@/lib/feed";
import { count } from "@/lib/format";
import { searchRepos } from "@/lib/sources/github";
import { RepoGrid } from "./repos-view";

/** Top of /skills: what people install (skills.sh) and what's new (GitHub). Either can be empty; the news below still shows. */
export async function SkillsBoard() {
  // A GitHub rate limit must not take the news down with it.
  const [skills, repos] = await Promise.all([
    getSkills(),
    searchRepos("skills", "week").catch((error) => {
      console.error("[skills] GitHub search failed:", error);
      return [];
    }),
  ]);

  return (
    <div className="my-5 space-y-8">
      {skills.length > 0 && (
        <section>
          <h2 className="font-semibold">Trending skills</h2>
          <p className="mt-0.5 text-xs text-muted">
            Installs this week, from{" "}
            <a href="https://skills.sh/trending" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
              skills.sh
            </a>
            . Counts are anonymous telemetry and can be inflated. Read a skill before installing it: it runs with your agent&apos;s permissions.
          </p>
          <ol className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {skills.slice(0, 12).map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 text-sm">
                <span className="w-5 shrink-0 font-mono text-xs text-muted">{i + 1}</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="min-w-0 hover:text-accent">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="block truncate text-xs text-muted">{s.source}</span>
                </a>
                <span className="ml-auto shrink-0 font-mono text-xs text-muted">{count(s.installs)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {repos.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <div>
              <h2 className="font-semibold">New skill repos</h2>
              <p className="mt-0.5 text-xs text-muted">GitHub · created this week, by stars</p>
            </div>
            <Link href="/repos/skills/week" className="shrink-0 text-xs font-medium text-accent hover:underline">
              All skill repos →
            </Link>
          </div>
          <RepoGrid repos={repos.slice(0, 6)} period="week" />
        </section>
      )}

      <h2 className="font-semibold">Skill news</h2>
    </div>
  );
}
