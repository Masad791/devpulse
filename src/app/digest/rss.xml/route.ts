import { getWeek } from "@/lib/feed";
import { isoWeek, rssResponse, rssXml, xml } from "@/lib/rss";
import { SITE_URL } from "@/lib/site";

export const revalidate = 1800;

// GET /digest/rss.xml — one item per ISO week (the guid), whose body is that week's top 10.
// Readers see one new item a week: a newsletter without email.
export async function GET() {
  const { articles, generatedAt } = await getWeek();
  const week = isoWeek(new Date(generatedAt));
  const list = articles
    .slice(0, 10)
    .map((a) => `<li><a href="${xml(a.url)}">${xml(a.title)}</a> — ${xml(a.source)}</li>`)
    .join("");
  return rssResponse(
    rssXml({
      title: "DevPulse weekly digest",
      link: `${SITE_URL}/digest`,
      self: `${SITE_URL}/digest/rss.xml`,
      description: "The week in tech for builders, every week.",
      items: [
        {
          title: `This week in tech — ${week}`,
          link: `${SITE_URL}/digest`,
          guid: `digest-${week}`,
          date: generatedAt,
          // rssXml escapes this again: readers unescape once and render the <ol> as HTML. The inner xml() calls
          // make sure story titles stay text inside that HTML.
          description: `<ol>${list}</ol><p><a href="${SITE_URL}/digest">Full digest: topics, rising tech, releases</a></p>`,
        },
      ],
    }),
  );
}
