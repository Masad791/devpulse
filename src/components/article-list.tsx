// One DOM for both layouts. `cards:` / `compact:` variants (globals.css) restyle it from the
// <html data-layout / data-density> attributes, so switching layout is instant and needs no re-render.
import Link from "next/link";
import { count, domain, favicon, timeAgo } from "@/lib/format";
import { CATEGORIES, type Article } from "@/lib/types";
import { ArrowUp, Comment } from "./icons";

export function ArticleList({ articles, now }: { articles: Article[]; now: number }) {
  return (
    <ol className="divide-y divide-line cards:grid cards:grid-cols-1 cards:gap-4 cards:divide-y-0 sm:cards:grid-cols-2">
      {articles.map((a) => (
        <ArticleItem key={a.id} article={a} now={now} />
      ))}
    </ol>
  );
}

function ArticleItem({ article: a, now }: { article: Article; now: number }) {
  return (
    <li className="flex flex-col gap-1.5 py-4 compact:gap-1 compact:py-2.5 cards:rounded-xl cards:border cards:border-line cards:bg-surface cards:p-4 cards:transition-colors cards:hover:border-accent/60">
      <div className="flex items-center gap-2 text-xs text-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- third-party favicons; nothing to optimize */}
        <img src={favicon(a.discussionUrl ?? a.url)} alt="" width={14} height={14} loading="lazy" className="size-3.5 rounded-sm" />
        <span className="font-medium text-fg/80">{a.source}</span>
        <span aria-hidden>·</span>
        <time dateTime={a.publishedAt}>{timeAgo(a.publishedAt, now)}</time>
      </div>

      <a
        href={a.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[15px] font-semibold leading-snug text-fg hover:text-accent compact:text-sm compact:font-medium cards:text-base"
      >
        {a.title}
        <span className="ml-1.5 text-xs font-normal text-muted cards:hidden">{domain(a.url)}</span>
      </a>

      {a.image && (
        /* eslint-disable-next-line @next/next/no-img-element -- images from 50 arbitrary hosts; next/image would need each whitelisted */
        <img
          src={a.image}
          alt=""
          loading="lazy"
          className="mt-1 hidden aspect-[2/1] w-full rounded-lg bg-line object-cover cards:block compact:hidden"
        />
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted cards:mt-auto cards:pt-1">
        {a.points > 0 && (
          <span className="inline-flex items-center gap-1" title="points">
            <ArrowUp className="size-3" />
            {count(a.points)}
          </span>
        )}
        {a.discussionUrl && (
          <a href={a.discussionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-fg">
            <Comment className="size-3" />
            {count(a.comments)}
          </a>
        )}
        <span className="flex flex-wrap gap-1.5 compact:hidden">
          {a.categories.slice(0, 3).map((c) => (
            <Link key={c} href={`/${c}`} title={CATEGORIES[c]} className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] hover:text-fg cards:bg-bg">
              #{c}
            </Link>
          ))}
        </span>
      </div>
    </li>
  );
}
