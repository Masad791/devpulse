import type { Metadata } from "next";
import Link from "next/link";
import { getTermTrends } from "@/lib/feed";
import type { TermTrend } from "@/lib/trends";

export const revalidate = 1800;
export const metadata: Metadata = { title: "Trend radar", description: "Which technologies developers are writing about more (or less) this week." };

export default async function TrendsPage() {
  const { trends, fromHistory, articles, generatedAt } = await getTermTrends();
  const active = trends.filter((t) => t.thisWeek + t.lastWeek >= 3);
  const rising = active.filter((t) => t.change !== null && t.change > 0).sort((a, b) => b.change! - a.change!).slice(0, 8);
  const cooling = active.filter((t) => t.change !== null && t.change < 0).sort((a, b) => a.change! - b.change!).slice(0, 8);
  const top = [...trends].sort((a, b) => b.thisWeek - a.thisWeek).slice(0, 15);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Trend radar</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          How often {trends.length} technologies appear in story titles across all sources, per day for 28 days. This week vs last week.{" "}
          {fromHistory
            ? `Based on ${articles.toLocaleString("en")} stories in the DevPulse database.`
            : "Running without a database, so this only covers what the sources currently list — history fills in once ingestion runs."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Board title="Rising" trends={rising} empty="Nothing is clearly rising yet." />
        <Board title="Cooling" trends={cooling} empty="Nothing is clearly cooling yet." />
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Most mentioned this week</h2>
        <ol className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((t, i) => (
            <li key={t.label} className="flex items-center gap-3 text-sm">
              <span className="w-5 font-mono text-xs text-muted">{i + 1}</span>
              <Link href={`/search?q=${encodeURIComponent(t.label.split(" /")[0])}`} className="w-28 truncate hover:text-accent">
                {t.label}
              </Link>
              <Sparkline daily={t.daily} />
              <span className="ml-auto font-mono text-xs text-muted">{t.thisWeek}</span>
            </li>
          ))}
        </ol>
      </section>
      <p className="text-xs text-muted">Updated {new Date(generatedAt).toUTCString().slice(5, 22)} UTC</p>
    </main>
  );
}

function Board({ title, trends, empty }: { title: string; trends: TermTrend[]; empty: string }) {
  return (
    <section>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {trends.length ? (
        <ul className="space-y-2.5">
          {trends.map((t) => (
            <li key={t.label} className="flex items-center gap-3 text-sm">
              <Link href={`/search?q=${encodeURIComponent(t.label.split(" /")[0])}`} className="w-28 truncate hover:text-accent">
                {t.label}
              </Link>
              <Sparkline daily={t.daily} />
              <span className="ml-auto text-right font-mono text-xs">
                <span className={t.change! > 0 ? "text-accent" : "text-muted"}>
                  {t.change! > 0 ? "+" : ""}
                  {Math.round(t.change! * 100)}%
                </span>
                <span className="block text-[10px] text-muted">
                  {t.lastWeek} → {t.thisWeek}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}

/** 28 days as a tiny inline SVG line — no chart library needed for this. */
function Sparkline({ daily }: { daily: number[] }) {
  const w = 120;
  const h = 24;
  const max = Math.max(1, ...daily);
  const points = daily.map((v, i) => `${((i / (daily.length - 1)) * w).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 text-accent" aria-hidden>
      <line x1={(21 / 27) * w} x2={(21 / 27) * w} y1="0" y2={h} className="stroke-line" strokeDasharray="2 2" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
