import { revalidateTag } from "next/cache";
import { ingest } from "@/lib/ingest";

// Called every 15 min by .github/workflows/ingest.yml (and `npm run ingest` locally).
// Vercel Cron sends the same "Authorization: Bearer <CRON_SECRET>" header, so it works there too.
export const maxDuration = 120;

async function handler(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) return Response.json({ error: "DATABASE_URL is not set" }, { status: 503 });

  const started = Date.now();
  // Vercel adds this header to every request once OIDC is on; the env var is for local runs (`vercel env pull`).
  const result = await ingest(request.headers.get("x-vercel-oidc-token") ?? process.env.VERCEL_OIDC_TOKEN);
  if (!result.skipped) {
    // Mark cached reads stale: the next visitor gets the old page instantly while a fresh one renders.
    for (const tag of ["feed", "search", "trends", "digest", "releases", "skills", "clicks"]) revalidateTag(tag, "max");
  }
  return Response.json({
    ...result,
    ...(result.skipped ? {} : { failed: result.sources.filter((s) => !s.ok).map((s) => s.name) }),
    sources: undefined,
    ms: Date.now() - started,
  });
}

export { handler as GET, handler as POST };
