import type { Metadata } from "next";
import { BuzzLive } from "@/components/buzz-live";
import { BLUESKY_HANDLES, MASTODON_SERVERS } from "@/lib/sources/social";
import { getBuzz } from "@/lib/feed";

export const revalidate = 120;
export const metadata: Metadata = { title: "Buzz — what engineers are saying" };

export default async function BuzzPage() {
  const buzz = await getBuzz();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">What engineers are saying</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Posts from {BLUESKY_HANDLES.length} engineers on Bluesky and trending posts on tech Mastodon servers (
          {MASTODON_SERVERS.join(", ")}). Checks for new posts every minute while this tab is open.
        </p>
      </div>
      {buzz.posts.length ? (
        <BuzzLive initial={buzz} />
      ) : (
        <p className="py-20 text-center text-muted">No posts right now. Try again in a minute.</p>
      )}
    </main>
  );
}
