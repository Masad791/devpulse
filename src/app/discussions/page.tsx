import type { Metadata } from "next";
import { hrefWith, param, Pills } from "@/components/filters";
import { getDiscussions } from "@/lib/feed";
import { count, domain, timeAgo } from "@/lib/format";
import type { Discussion } from "@/lib/sources/discussions";

export const metadata: Metadata = {
  title: "Discussions",
  description: "The most heated developer discussions right now: Hacker News, Ask HN, Lobsters and Dev.to.",
};

const KINDS = { all: "All", debate: "Hot debates", ask: "Ask & advice" } as const;

export default async function DiscussionsPage({ searchParams }: PageProps<"/discussions">) {
  const kind = param((await searchParams).kind);
  const active = kind === "ask" || kind === "debate" ? kind : "all";
  const { generatedAt, discussions } = await getDiscussions();
  const shown = discussions.filter((d) => active === "all" || d.kind === active).slice(0, 60);
  const now = Date.parse(generatedAt);

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Discussions</h1>
        <p className="mt-1 text-sm text-muted">The threads developers are arguing about right now, ranked by comment volume and freshness.</p>
      </div>
      <Pills items={Object.entries(KINDS)} active={active} hrefFor={(k) => hrefWith("/discussions", { kind: k === "all" ? undefined : k })} />
      {shown.length ? (
        <ol className="divide-y divide-line">
          {shown.map((d) => (
            <Row key={d.id} d={d} now={now} />
          ))}
        </ol>
      ) : (
        <p className="py-16 text-center text-muted">Nothing here right now. Check back in a few minutes.</p>
      )}
    </main>
  );
}

function Row({ d, now }: { d: Discussion; now: number }) {
  return (
    <li className="flex items-start gap-4 py-3.5">
      <a
        href={d.threadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="grid w-16 shrink-0 place-items-center rounded-lg border border-line bg-surface py-1.5 text-center hover:border-accent/60"
        title="Open the discussion"
      >
        <span className="text-base font-semibold leading-none">{count(d.comments)}</span>
        <span className="text-[10px] text-muted">comments</span>
      </a>
      <div className="min-w-0 space-y-1">
        <a href={d.threadUrl} target="_blank" rel="noopener noreferrer" className="block font-medium leading-snug hover:text-accent">
          {d.title}
        </a>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <span className="font-medium text-fg/80">{d.source}</span>
          <span aria-hidden>·</span>
          <span>▲ {count(d.points)}</span>
          <span aria-hidden>·</span>
          <time dateTime={d.createdAt}>{timeAgo(d.createdAt, now)}</time>
          {d.linkUrl && (
            <>
              <span aria-hidden>·</span>
              <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:text-fg">
                {domain(d.linkUrl)} ↗
              </a>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
