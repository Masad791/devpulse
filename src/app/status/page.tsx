import type { Metadata } from "next";
import { getFeed, getStatus } from "@/lib/feed";

export const dynamic = "force-dynamic"; // a status page must never show a cached "all good"
export const metadata: Metadata = { title: "Status" };

export default async function StatusPage() {
  const [status, feed] = await Promise.all([getStatus(), getFeed()]);
  const age = status.db ? status.minutesSinceIngest : null;
  const healthy = !status.db || (age !== null && age < 60);
  const up = feed.sources.filter((s) => s.ok).length;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      <div className="flex items-center gap-3">
        <span className={`size-3 rounded-full ${healthy ? "bg-emerald-500" : "bg-amber-500"}`} />
        <h1 className="text-xl font-semibold tracking-tight">{healthy ? "All systems normal" : "Data is getting stale"}</h1>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Mode" value={status.db ? "Database" : "Live fetch"} />
        <Stat label="Sources up" value={`${up}/${feed.sources.length}`} />
        <Stat label="Last ingest" value={age === null ? (status.db ? "never" : "n/a") : `${age} min ago`} />
        <Stat label="Stories stored" value={status.db ? status.articles.toLocaleString("en") : "n/a"} />
      </dl>

      {status.db && (
        <section>
          <h2 className="mb-2 font-semibold">Recent ingest runs</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 font-normal">Started (UTC)</th>
                <th className="font-normal">Duration</th>
                <th className="font-normal">New</th>
                <th className="font-normal">Updated</th>
                <th className="font-normal">Failed sources</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono text-xs">
              {status.runs.map((r) => (
                <tr key={r.id}>
                  <td className="py-1.5">{new Date(r.started_at).toISOString().slice(5, 16).replace("T", " ")}</td>
                  <td>{r.finished_at ? `${((Date.parse(String(r.finished_at)) - Date.parse(String(r.started_at))) / 1000).toFixed(1)}s` : "running / failed"}</td>
                  <td>{r.inserted ?? "–"}</td>
                  <td>{r.updated ?? "–"}</td>
                  <td className={r.failed ? "text-amber-600" : ""}>{r.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Sources</h2>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {feed.sources.map((s) => (
            <li key={s.name} className="flex items-center gap-2" title={s.error}>
              <span className={`size-2 shrink-0 rounded-full ${s.ok ? "bg-emerald-500" : "bg-red-500"}`} />
              <span className="truncate">{s.name}</span>
              <span className="ml-auto font-mono text-xs text-muted">{s.ok ? s.count : "down"}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-muted">
        Machine-readable: <code>/api/health</code> returns 200 when healthy, 503 when not — point an uptime monitor at it.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
