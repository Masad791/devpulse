import { XMLParser } from "fast-xml-parser";
import type { Category, RawArticle, Source } from "../types";
import { getText } from "./http";

const parser = new XMLParser({
  ignoreAttributes: false,
  htmlEntities: true,
  isArray: (name) => ["item", "entry", "link", "category", "media:content", "enclosure"].includes(name),
});

type Node = Record<string, unknown>;
const text = (v: unknown): string =>
  typeof v === "object" && v !== null ? String((v as Node)["#text"] ?? "") : String(v ?? "");
const nodes = (v: unknown): Node[] => ((v as Node[]) ?? []).filter((n) => typeof n === "object" && n !== null);

/** Feeds hide the cover image in one of ~4 places. Try the cheap structured ones, then the first <img> in the body. */
function findImage(it: Node): string | undefined {
  const media = nodes(it["media:content"]).find((m) => m["@_medium"] === "image" || String(m["@_type"] ?? "").startsWith("image"));
  const thumb = it["media:thumbnail"] as Node | undefined;
  const enclosure = nodes(it.enclosure).find((e) => String(e["@_type"] ?? "").startsWith("image"));
  const body = text(it["content:encoded"] ?? it.content ?? it.description);
  const url = media?.["@_url"] ?? thumb?.["@_url"] ?? enclosure?.["@_url"] ?? body.match(/<img[^>]+src=["']([^"']+)["']/)?.[1];
  return typeof url === "string" && url.startsWith("https://") ? url : undefined;
}

/** Handles both RSS 2.0 (<item>) and Atom (<entry>) — the two formats engineering blogs use. */
export function parseFeed(xml: string, source: string, categories?: Category[]): RawArticle[] {
  const doc = parser.parse(xml);
  const items: Node[] = doc.rss?.channel?.item ?? doc.feed?.entry ?? [];
  return items.slice(0, 10).flatMap((it) => {
    const links = (it.link as unknown[]) ?? [];
    // RSS: <link>url</link>. Atom: <link href="url" rel="alternate"/>.
    const atomLink = nodes(links).find((l) => (l["@_rel"] ?? "alternate") === "alternate");
    const url = atomLink ? String(atomLink["@_href"]) : text(links[0]);
    const time = Date.parse(String(it.pubDate ?? it.published ?? it.updated));
    if (!url || Number.isNaN(time)) return []; // one malformed item must not sink the whole feed
    return [
      {
        id: `${source}:${url}`,
        title: text(it.title).trim(),
        url,
        source,
        image: findImage(it),
        points: 0,
        comments: 0,
        publishedAt: new Date(time).toISOString(),
        // RSS: <category>x</category>. Atom: <category term="x"/>.
        tags: ((it.category as unknown[]) ?? []).map((c) => text(c) || String((c as Node)["@_term"] ?? "")).filter(Boolean),
        categories,
      },
    ];
  });
}

export const rssSource = (name: string, url: string, categories?: Category[]): Source => ({
  name,
  fetch: async () => parseFeed(await getText(url), name, categories),
});
