// "What engineers are saying": posts from engineers on Bluesky + trending posts on tech Mastodon servers.
// X/Twitter has no free read API, so these two open networks are where we can get this for free.
import { httpUrl, matchTopics } from "../pipeline";
import type { Post } from "../types";
import { getJson } from "./http";

const SOCIAL_REVALIDATE = 120; // social moves faster than blogs

// Curated, active engineering voices. PRs welcome — keep it to people who mostly post about tech.
export const BLUESKY_HANDLES = [
  "kelseyhightower.com",
  "simonwillison.net",
  "gergely.pragmaticengineer.com",
  "charity.wtf",
  "danabra.mov",
  "steveklabnik.com",
  "martinfowler.com",
  "hillelwayne.com",
  "thorstenball.com",
  "swyx.io",
  "t3.gg",
  "wesbos.com",
  "kentcdodds.com",
  "tannerlinsley.com",
  "mattpocock.com",
  "antfu.me",
  "cassidoo.co",
  "hynek.me",
  "jakelazaroff.com",
  "emollick.bsky.social",
];

// Tech-focused servers. Their trending lists still mix in jokes, so posts must match a topic (see below).
export const MASTODON_SERVERS = ["hachyderm.io", "fosstodon.org", "infosec.exchange"];

type BskyItem = {
  post: {
    uri: string;
    author: { handle: string; displayName?: string; avatar?: string };
    record: { text: string; createdAt: string };
    embed?: { external?: { uri: string; title: string } };
    likeCount?: number;
    repostCount?: number;
    replyCount?: number;
  };
  reason?: unknown; // set when this is a repost of someone else
};

async function blueskyAuthor(handle: string): Promise<Post[]> {
  const { feed } = await getJson<{ feed: BskyItem[] }>(
    `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=10&filter=posts_no_replies`,
    { revalidate: SOCIAL_REVALIDATE },
  );
  return feed
    .filter((item) => !item.reason && item.post.record.text.trim())
    .map(({ post }): Post => ({
      id: post.uri,
      network: "Bluesky",
      url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").pop()}`,
      author: {
        name: post.author.displayName || post.author.handle,
        handle: `@${post.author.handle}`,
        avatar: httpUrl(post.author.avatar),
        url: `https://bsky.app/profile/${post.author.handle}`,
      },
      text: post.record.text,
      link: link(post.embed?.external?.uri, post.embed?.external?.title),
      createdAt: post.record.createdAt,
      likes: post.likeCount ?? 0,
      reposts: post.repostCount ?? 0,
      replies: post.replyCount ?? 0,
    }));
}

type MastodonStatus = {
  id: string;
  url: string;
  created_at: string;
  content: string; // HTML
  sensitive: boolean;
  spoiler_text: string;
  account: { display_name: string; acct: string; avatar: string; url: string };
  card: { url: string; title: string } | null;
  favourites_count: number;
  reblogs_count: number;
  replies_count: number;
};

/** A link preview, only if its URL is http(s) — these come straight from other people's posts. */
function link(url: string | undefined, title: string | undefined) {
  const safe = httpUrl(url);
  return safe ? { url: safe, title: title ?? "" } : undefined;
}

/** Mastodon gives HTML. We render plain text (React escapes it), so strip tags and decode the common entities. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " })[e]!)
    .trim();
}

async function mastodonTrending(server: string): Promise<Post[]> {
  const statuses = await getJson<MastodonStatus[]>(`https://${server}/api/v1/trends/statuses?limit=15`, {
    revalidate: SOCIAL_REVALIDATE,
  });
  return statuses
    .filter((s) => !s.sensitive && !s.spoiler_text && httpUrl(s.url))
    .map((s): Post => ({
      id: `${server}:${s.id}`,
      network: "Mastodon",
      url: s.url,
      author: {
        name: s.account.display_name || s.account.acct,
        handle: `@${s.account.acct.includes("@") ? s.account.acct : `${s.account.acct}@${server}`}`,
        avatar: httpUrl(s.account.avatar),
        url: httpUrl(s.account.url) ?? `https://${server}`,
      },
      text: htmlToText(s.content),
      link: link(s.card?.url, s.card?.title),
      createdAt: s.created_at,
      likes: s.favourites_count,
      reposts: s.reblogs_count,
      replies: s.replies_count,
    }))
    .filter((p) => matchTopics(`${p.text} ${p.link?.title ?? ""}`).length > 0);
}

export const socialFetchers: { name: string; fetch: () => Promise<Post[]> }[] = [
  ...BLUESKY_HANDLES.map((h) => ({ name: `Bluesky ${h}`, fetch: () => blueskyAuthor(h) })),
  ...MASTODON_SERVERS.map((s) => ({ name: `Mastodon ${s}`, fetch: () => mastodonTrending(s) })),
];
