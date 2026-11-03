// RSS 2.0 output, so readers can follow DevPulse (or one topic, or the weekly digest) in any feed reader.

const ENTITIES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
/** Everything we put in XML is text from 50+ outside sources: escape all of it. */
export const xml = (s: string) => s.replace(/[<>&'"]/g, (c) => ENTITIES[c]);

export type RssItem = { title: string; link: string; guid: string; date: string; description?: string; categories?: string[] };

export function rssXml(channel: { title: string; link: string; self: string; description: string; items: RssItem[] }): string {
  const items = channel.items
    .map(
      (i) => `<item><title>${xml(i.title)}</title><link>${xml(i.link)}</link><guid isPermaLink="false">${xml(i.guid)}</guid>` +
        `<pubDate>${new Date(i.date).toUTCString()}</pubDate>` +
        (i.description ? `<description>${xml(i.description)}</description>` : "") +
        (i.categories ?? []).map((c) => `<category>${xml(c)}</category>`).join("") +
        `</item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${xml(channel.title)}</title><link>${xml(channel.link)}</link><description>${xml(channel.description)}</description>
<atom:link href="${xml(channel.self)}" rel="self" type="application/rss+xml"/>
${items}
</channel></rss>`;
}

export const rssResponse = (body: string) =>
  new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
  });

/** ISO-8601 week, e.g. "2026-W41" — the weekly digest's id. */
export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // Thursday decides which year the week belongs to
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
