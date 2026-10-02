import { getFeed } from "@/lib/feed";
import { CATEGORIES, isCategory } from "@/lib/types";

// Public JSON API: GET /api/feed?category=ai&limit=20
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requested = params.get("category");
  const limit = Math.min(Math.max(Number(params.get("limit")) || 50, 1), 200);

  if (requested && !isCategory(requested)) {
    return Response.json({ error: "Unknown category", categories: Object.keys(CATEGORIES) }, { status: 400 });
  }
  const category = isCategory(requested) ? requested : undefined;

  const feed = await getFeed();
  const articles = (category ? feed.articles.filter((a) => a.categories.includes(category)) : feed.articles).slice(0, limit);

  return Response.json(
    { ...feed, articles },
    {
      headers: {
        // CDN caches each URL for 15 min, then serves stale for up to 1h while refreshing in the background.
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
