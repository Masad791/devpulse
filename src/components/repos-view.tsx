import Link from "next/link";
import { hrefWith, Pills } from "@/components/filters";
import { NavSelect } from "@/components/nav-select";
import { count, timeAgo } from "@/lib/format";
import { LANGUAGES, REPO_CATEGORIES, REPO_PERIODS, searchRepos, type Repo, type RepoCategory, type RepoPeriod } from "@/lib/sources/github";

// Filters live in the PATH (/repos/mcp/month/python), not the query string, so every view is an ISR page
// the CDN can cache. A query string made this page render on every request (~2 s from Asia).

/** "C#" -> "csharp", "C++" -> "cpp", "TypeScript" -> "typescript" */
export const langSlug = (language: string) => language.toLowerCase().replace("#", "sharp").replaceAll("+", "p");

type Filters = { category: RepoCategory; period: RepoPeriod; language?: string };

export const reposHref = ({ category, period, language }: Filters) =>
  category === "all" && period === "week" && !language ? "/repos" : `/repos/${category}/${period}${language ? `/${langSlug(language)}` : ""}`;

/** Parses ["mcp", "month", "python"] -> filters, or null for an invalid path (the page 404s). */
export function parseRepoPath(segments: string[]): Filters | null {
  const [category = "all", period = "week", lang, ...rest] = segments;
  const language = lang ? LANGUAGES.find((l) => langSlug(l) === lang) : undefined;
  if (rest.length || !Object.hasOwn(REPO_CATEGORIES, category) || !Object.hasOwn(REPO_PERIODS, period) || (lang && !language)) return null;
  return { category: category as RepoCategory, period: period as RepoPeriod, language };
}

export async function ReposView(filters: Filters) {
  // Throws on a GitHub error/rate limit: a failed render is never cached, so ISR keeps serving the last good
  // page and the route's error.tsx offers a retry.
  const repos = await searchRepos(filters.category, filters.period, filters.language);

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
        active={filters.category}
        hrefFor={(k) => reposHref({ ...filters, category: k as RepoCategory })}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pills
          items={Object.entries(REPO_PERIODS).map(([k, v]) => [k, v.label])}
          active={filters.period}
          hrefFor={(k) => reposHref({ ...filters, period: k as RepoPeriod })}
        />
        <NavSelect
          label="Language"
          value={reposHref(filters)}
          options={[
            [reposHref({ ...filters, language: undefined }), "Any"],
            ...LANGUAGES.map((l): [string, string] => [reposHref({ ...filters, language: l }), l]),
          ]}
        />
      </div>

      {repos.length === 0 ? (
        <p className="py-16 text-center text-muted">No repos match. Try another window or language.</p>
      ) : (
        <RepoGrid repos={repos} period={filters.period} />
      )}
    </main>
  );
}

const stamp = () => ({ now: Date.now() });

export function RepoGrid({ repos, period }: { repos: Repo[]; period: string }) {
  const { now } = stamp();
  return (
    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((r) => (
        <RepoCard key={r.name} repo={r} now={now} period={period} />
      ))}
    </ol>
  );
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
