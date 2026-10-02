import type { Metadata } from "next";
import Link from "next/link";
import { hrefWith, oneOf, param, Pills, SelectFilter } from "@/components/filters";
import { count, timeAgo } from "@/lib/format";
import { isRateLimit, LANGUAGES, REPO_CATEGORIES, REPO_PERIODS, searchRepos, type Repo } from "@/lib/sources/github";

export const metadata: Metadata = {
  title: "Trending repos",
  description: "Trending GitHub repos by category: Claude skills, AI agents, MCP servers, self-hosted alternatives, DevOps and more.",
};

export default async function ReposPage({ searchParams }: PageProps<"/repos">) {
  const sp = await searchParams;
  const category = oneOf(param(sp.category), REPO_CATEGORIES, "all");
  const period = oneOf(param(sp.period), REPO_PERIODS, "week");
  const language = LANGUAGES.find((l) => l === param(sp.language));
  const current = { category, period, language };

  const { repos, error, now } = await load(category, period, language);

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Trending repos</h1>
        <p className="mt-1 text-sm text-muted">
          GitHub has no trending API, so “new” = repos created in that window, ranked by stars; “popular &amp; active” = most-starred repos pushed this week.
        </p>
      </div>

      <Pills
        items={Object.entries(REPO_CATEGORIES).map(([k, v]) => [k, v.label])}
        active={category}
        hrefFor={(k) => hrefWith("/repos", { ...current, category: k })}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pills
          items={Object.entries(REPO_PERIODS).map(([k, v]) => [k, v.label])}
          active={period}
          hrefFor={(k) => hrefWith("/repos", { ...current, period: k })}
        />
        <SelectFilter
          action="/repos"
          name="language"
          label="Language"
          value={language}
          hidden={{ category, period }}
          options={[["", "Any"], ...LANGUAGES.map((l): [string, string] => [l, l])]}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-muted">{error}</p>
      ) : repos.length === 0 ? (
        <p className="py-16 text-center text-muted">No repos match. Try another window or language.</p>
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((r) => (
            <RepoCard key={r.name} repo={r} now={now} period={period} />
          ))}
        </ol>
      )}
    </main>
  );
}

async function load(...args: Parameters<typeof searchRepos>): Promise<{ repos: Repo[]; error?: string; now: number }> {
  try {
    return { repos: await searchRepos(...args), now: Date.now() };
  } catch (e) {
    const error = isRateLimit(e)
      ? "GitHub's search rate limit was hit. Results are cached, so try again in a minute."
      : "GitHub search is unavailable right now.";
    return { repos: [], error, now: Date.now() };
  }
}

function RepoCard({ repo: r, now, period }: { repo: Repo; now: number; period: string }) {
  const [owner, name] = r.name.split("/");
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4 hover:border-accent/60">
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold leading-tight hover:text-accent">
        {/* eslint-disable-next-line @next/next/no-img-element -- GitHub avatars */}
        <img src={`https://github.com/${owner}.png?size=40`} alt="" width={20} height={20} loading="lazy" className="size-5 rounded" />
        <span className="truncate">
          <span className="font-normal text-muted">{owner}/</span>
          {name}
        </span>
      </a>
      {r.description && <p className="line-clamp-2 text-sm text-muted">{r.description}</p>}
      {r.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.topics.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md bg-bg px-1.5 py-0.5 text-[11px] text-muted">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted">
        <span className="font-medium text-fg">★ {count(r.stars)}</span>
        <span>⑂ {count(r.forks)}</span>
        {r.language && <span>{r.language}</span>}
        <span>{period === "active" ? `pushed ${timeAgo(r.pushedAt, now)}` : `created ${timeAgo(r.createdAt, now)}`}</span>
        {r.openIssues > 0 && (
          <Link href={hrefWith("/contribute", { repo: r.name })} className="ml-auto font-medium text-accent hover:underline">
            Contribute →
          </Link>
        )}
      </div>
    </li>
  );
}
