import { getFeed } from "@/lib/feed";
import { MAX_PAGES, paginate } from "@/lib/pipeline";
import { CATEGORIES, isCategory } from "@/lib/types";

const HEADERS = {
  // CDN caches each URL for 5 min, then serves stale for up to 1h while refreshing in the background.
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
  "Access-Control-Allow-Origin": "*",
};

// Public JSON API: GET /api/feed?topic=ai,devops&page=2&limit=30
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requested = (params.get("topic") ?? "").split(",").filter(Boolean);
  const topics = requested.filter(isCategory);
  const page = Math.min(Math.max(Math.trunc(Number(params.get("page"))) || 1, 1), MAX_PAGES);
  const limit = Math.min(Math.max(Math.trunc(Number(params.get("limit"))) || 30, 1), 100);

  if (topics.length !== requested.length) {
    return Response.json({ error: "Unknown topic", topics: Object.keys(CATEGORIES) }, { status: 400, headers: HEADERS });
  }

  const { generatedAt, articles, sources } = await getFeed();
  return Response.json({ generatedAt, ...paginate(articles, topics, page, limit), sources }, { headers: HEADERS });
}
