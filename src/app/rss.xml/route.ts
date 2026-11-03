import { getFeed } from "@/lib/feed";
import { rssResponse, rssXml } from "@/lib/rss";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES } from "@/lib/types";

export const revalidate = 900;

// GET /rss.xml — the top 50 stories. Per-topic feeds live at /<topic>/rss.xml.
export async function GET() {
  const { articles } = await getFeed();
  return rssResponse(
    rssXml({
      title: "DevPulse — top stories",
      link: SITE_URL,
      self: `${SITE_URL}/rss.xml`,
      description: "Tech news for builders: AI, system design, DevOps, security and more.",
      items: articles.slice(0, 50).map((a) => ({
        title: a.title,
        link: a.url,
        guid: a.id,
        date: a.publishedAt,
        description: `${a.source}${a.discussionUrl ? ` · discussion: ${a.discussionUrl}` : ""}`,
        categories: a.categories.map((c) => CATEGORIES[c]),
      })),
    }),
  );
}
