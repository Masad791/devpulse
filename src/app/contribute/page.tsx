import type { Metadata } from "next";
import Link from "next/link";
import { hrefWith, oneOf, param, Pills } from "@/components/filters";
import { Comment } from "@/components/icons";
import { Pagination } from "@/components/pagination";
import { timeAgo } from "@/lib/format";
import { MAX_PAGES } from "@/lib/pipeline";
import {
  isRateLimit,
  ISSUE_LABELS,
  ISSUE_SORTS,
  ISSUES_PER_PAGE,
  LANGUAGES,
  searchIssues,
  type Issue,
  type IssueFilters,
} from "@/lib/sources/github";

export const metadata: Metadata = {
  title: "Contribute to open source",
  description: "Find good first issues, help wanted and hacktoberfest issues on GitHub, filtered by language and label.",
};

export default async function ContributePage({ searchParams }: PageProps<"/contribute">) {
  const sp = await searchParams;
  const filters: IssueFilters = {
    label: oneOf(param(sp.label), ISSUE_LABELS, "beginner"),
    language: LANGUAGES.find((l) => l === param(sp.language)),
    repo: param(sp.repo),
    keyword: param(sp.q),
    unassigned: param(sp.all) !== "1", // unassigned by default: assigned issues are usually taken
    sort: oneOf(param(sp.sort), ISSUE_SORTS, "updated"),
    page: Math.min(Math.max(Number(param(sp.page)) || 1, 1), MAX_PAGES),
  };
  // Every link/form keeps the other filters; changing a filter resets to page 1.
  const query = {
    label: filters.label,
    language: filters.language,
    repo: filters.repo,
    q: filters.keyword,
    all: filters.unassigned ? undefined : "1",
    sort: filters.sort,
  };
  const { total, issues, error, now } = await load(filters);
  const totalPages = Math.min(Math.ceil(total / ISSUES_PER_PAGE), MAX_PAGES);

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Find your next open source contribution</h1>
        <p className="mt-1 text-sm text-muted">Open GitHub issues that maintainers marked as ready for new contributors. Pick a label, a language, go.</p>
      </div>

      <Pills
        items={Object.entries(ISSUE_LABELS).map(([k, v]) => [k, v.label])}
        active={filters.label}
        hrefFor={(k) => hrefWith("/contribute", { ...query, label: k })}
      />

      {/* A plain GET form: the URL is the state, so every search is shareable and works without JS. */}
      <form action="/contribute" className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
        <input type="hidden" name="label" value={filters.label} />
        <Field label="Language">
          <select name="language" defaultValue={filters.language ?? ""} className={input}>
            <option value="">Any</option>
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Sort">
          <select name="sort" defaultValue={filters.sort} className={input}>
            {Object.entries(ISSUE_SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Keyword">
          <input name="q" defaultValue={filters.keyword} placeholder="e.g. docs, api, test" maxLength={60} className={`${input} w-40`} />
        </Field>
        <Field label="Repo">
          <input name="repo" defaultValue={filters.repo} placeholder="owner/name" pattern="[\w.\-]+/[\w.\-]+" className={`${input} w-40`} />
        </Field>
        <label className="flex items-center gap-2 pb-1.5 text-muted">
          <input type="checkbox" name="all" value="1" defaultChecked={!filters.unassigned} className="accent-[var(--accent)]" />
          Include assigned
        </label>
        <button className="rounded-lg bg-fg px-4 py-1.5 font-medium text-bg">Search</button>
      </form>

      {error ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-muted">{error}</p>
      ) : (
        <>
          <p className="text-xs text-muted">
            {total.toLocaleString("en")} open issues
            {filters.repo && (
              <>
                {" "}
                in <span className="font-medium text-fg">{filters.repo}</span> ·{" "}
                <Link href={hrefWith("/contribute", { ...query, repo: undefined })} className="underline">
                  all repos
                </Link>
              </>
            )}
          </p>
          {issues.length ? (
            <ol className="divide-y divide-line">
              {issues.map((i) => (
                <IssueRow key={i.url} issue={i} now={now} hrefForRepo={(repo) => hrefWith("/contribute", { ...query, repo })} />
              ))}
            </ol>
          ) : (
            <p className="py-16 text-center text-muted">No open issues match. Try “Any beginner label” or another language.</p>
          )}
          <Pagination page={filters.page} totalPages={totalPages} hrefFor={(page) => hrefWith("/contribute", { ...query, page: page > 1 ? page : undefined })} />
        </>
      )}
    </main>
  );
}

const input = "rounded-lg border border-line bg-bg px-2.5 py-1.5 text-fg";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

async function load(filters: IssueFilters): Promise<{ total: number; issues: Issue[]; error?: string; now: number }> {
  try {
    return { ...(await searchIssues(filters)), now: Date.now() };
  } catch (e) {
    const error = isRateLimit(e)
      ? "GitHub's search rate limit was hit (10 searches/min without a token). Try again in a minute."
      : "GitHub search is unavailable right now.";
    return { total: 0, issues: [], error, now: Date.now() };
  }
}

const HEX = /^[0-9a-f]{6}$/i;

function IssueRow({ issue: i, now, hrefForRepo }: { issue: Issue; now: number; hrefForRepo: (repo: string) => string }) {
  return (
    <li className="flex gap-3 py-3.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- GitHub avatars */}
      <img src={`https://github.com/${i.repo.split("/")[0]}.png?size=40`} alt="" width={28} height={28} loading="lazy" className="mt-0.5 size-7 shrink-0 rounded-md bg-line" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <Link href={hrefForRepo(i.repo)} className="font-medium text-fg/80 hover:text-accent" title="Only issues from this repo">
            {i.repo}
          </Link>
          <span aria-hidden>·</span>
          <span>updated {timeAgo(i.updatedAt, now)}</span>
        </div>
        <a href={i.url} target="_blank" rel="noopener noreferrer" className="block font-medium leading-snug hover:text-accent">
          {i.title}
        </a>
        <div className="flex flex-wrap items-center gap-1.5">
          {i.labels.slice(0, 5).map((l) => (
            <span
              key={l.name}
              className="rounded-full border px-2 py-0.5 text-[11px]"
              style={HEX.test(l.color) ? { borderColor: `#${l.color}99`, backgroundColor: `#${l.color}22` } : undefined}
            >
              {l.name}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
            <Comment className="size-3" /> {i.comments}
          </span>
        </div>
      </div>
    </li>
  );
}
