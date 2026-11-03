import { getFeed } from "@/lib/feed";
import { rssResponse, rssXml } from "@/lib/rss";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES, isCategory } from "@/lib/types";

export const revalidate = 900;

export function generateStaticParams() {
  return [];
}

// GET /<topic>/rss.xml — e.g. /system-design/rss.xml
export async function GET(_request: Request, { params }: RouteContext<"/[topic]/rss.xml">) {
  const { topic } = await params;
  if (!isCategory(topic)) return new Response("Unknown topic", { status: 404 });
  const { articles } = await getFeed();
  return rssResponse(
    rssXml({
      title: `DevPulse — ${CATEGORIES[topic]}`,
      link: `${SITE_URL}/${topic}`,
      self: `${SITE_URL}/${topic}/rss.xml`,
      description: `${CATEGORIES[topic]} news for builders.`,
      items: articles
        .filter((a) => a.categories.includes(topic))
        .slice(0, 50)
        .map((a) => ({ title: a.title, link: a.url, guid: a.id, date: a.publishedAt, description: a.source })),
    }),
  );
}
