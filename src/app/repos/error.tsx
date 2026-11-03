"use client";

// Shown when a GitHub search fails (usually the rate limit). Failed renders aren't cached, so retrying works.
export default function ReposError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-lg font-semibold">GitHub is busy right now</h1>
      <p className="mt-2 text-sm text-muted">
        We hit GitHub&apos;s search rate limit (10 searches/minute without a token). Results are cached once they load, so this is rare.
      </p>
      <button onClick={() => retry()} className="mt-6 rounded-lg bg-fg px-4 py-2 text-sm font-medium text-bg">
        Try again
      </button>
    </main>
  );
}
