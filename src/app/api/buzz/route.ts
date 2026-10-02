import { getBuzz } from "@/lib/feed";

// GET /api/buzz — polled every minute by open /buzz tabs. The CDN answers most of those polls,
// so 10,000 open tabs still mean ~1 upstream refresh per minute.
export async function GET() {
  return Response.json(await getBuzz(), {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
