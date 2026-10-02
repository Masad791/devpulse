import { count, domain, timeAgo } from "@/lib/format";
import type { Post } from "@/lib/types";
import { Comment, Heart, Repost } from "./icons";

export function PostCard({ post: p, now, clamp = false }: { post: Post; now: number; clamp?: boolean }) {
  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <header className="flex items-center gap-2.5">
        {p.author.avatar ? (
          /* eslint-disable-next-line @next/next/no-img-element -- avatars from Bluesky/Mastodon CDNs */
          <img src={p.author.avatar} alt="" width={36} height={36} loading="lazy" className="size-9 rounded-full bg-line" />
        ) : (
          <span className="size-9 rounded-full bg-line" />
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <a href={p.author.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-semibold hover:underline">
            {p.author.name}
          </a>
          <span className="block truncate text-xs text-muted">{p.author.handle}</span>
        </div>
        <span className="shrink-0 rounded-md bg-bg px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          {p.network}
        </span>
      </header>

      <p className={`mt-3 whitespace-pre-line break-words text-sm leading-relaxed ${clamp ? "line-clamp-4" : ""}`}>{p.text}</p>

      {p.link && (
        <a
          href={p.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block rounded-lg border border-line bg-bg px-3 py-2 text-xs hover:border-accent/60"
        >
          <span className="block truncate font-medium">{p.link.title || p.link.url}</span>
          <span className="text-muted">{domain(p.link.url)}</span>
        </a>
      )}

      <footer className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3" /> {count(p.likes)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Repost className="size-3" /> {count(p.reposts)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Comment className="size-3" /> {count(p.replies)}
        </span>
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="ml-auto hover:text-fg">
          <time dateTime={p.createdAt}>{timeAgo(p.createdAt, now)}</time> ↗
        </a>
      </footer>
    </article>
  );
}
