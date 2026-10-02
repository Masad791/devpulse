"use client";

// Near-real-time: poll the CDN-cached /api/buzz every minute while the tab is visible, and offer
// "N new posts" instead of shuffling the list under the reader (the Twitter pattern).
import { useEffect, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "./post-card";

type Snapshot = { posts: Post[]; generatedAt: string };
const POLL_MS = 60_000;

export function BuzzLive({ initial }: { initial: Snapshot }) {
  const [shown, setShown] = useState(initial);
  const [latest, setLatest] = useState<Snapshot | null>(null);

  useEffect(() => {
    const id = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/buzz");
        if (res.ok) setLatest(await res.json());
      } catch {
        // offline or upstream hiccup: try again next tick
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const known = new Set(shown.posts.map((p) => p.id));
  const fresh = latest ? latest.posts.filter((p) => !known.has(p.id)).length : 0;
  const now = Date.parse(shown.generatedAt);

  return (
    <>
      {fresh > 0 && (
        <button
          onClick={() => {
            setShown(latest!);
            setLatest(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="sticky top-28 z-10 mx-auto mb-4 block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-bg shadow-lg"
        >
          Show {fresh} new {fresh === 1 ? "post" : "posts"}
        </button>
      )}
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {shown.posts.map((p) => (
          <PostCard key={p.id} post={p} now={now} />
        ))}
      </div>
    </>
  );
}
