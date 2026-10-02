import type { Metadata } from "next";
import { Suspense } from "react";
import { ForYou } from "@/components/for-you";

export const metadata: Metadata = { title: "For you" };

// A static shell; the personalized list is fetched in the browser from /api/feed using the
// topics saved in localStorage — so this page is the same cached file for every visitor.
export default function ForYouPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Suspense>
        <ForYou />
      </Suspense>
    </main>
  );
}
