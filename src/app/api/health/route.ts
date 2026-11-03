import { sql } from "@/lib/db";

// GET /api/health — for uptime monitors (UptimeRobot, Better Stack…). 200 = healthy, 503 = needs attention.
// "Healthy" means: the DB answers and the last ingest finished within the last hour.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!sql) return Response.json({ ok: true, mode: "live-fetch" });
  try {
    const [run] = await sql<{ finished_at: Date | null }[]>`select max(finished_at) as finished_at from ingest_runs`;
    const minutesSinceIngest = run.finished_at ? Math.round((Date.now() - run.finished_at.getTime()) / 60_000) : null;
    const ok = minutesSinceIngest !== null && minutesSinceIngest < 60;
    return Response.json({ ok, mode: "database", minutesSinceIngest }, { status: ok ? 200 : 503 });
  } catch {
    return Response.json({ ok: false, mode: "database", error: "database unreachable" }, { status: 503 });
  }
}
