// Triggers one ingest run on a running server. Usage: npm run ingest (server must be up).
// In production a scheduled GitHub Action does the same call every 15 minutes (.github/workflows/ingest.yml).
const base = process.env.SITE_URL ?? "http://localhost:3000";
const res = await fetch(`${base}/api/cron/ingest`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
});
console.log(res.status, await res.text());
process.exit(res.ok ? 0 : 1);
