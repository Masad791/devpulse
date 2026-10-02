import { XMLParser } from "fast-xml-parser";
import type { Category, RawArticle, Source } from "../types";
import { getText } from "./http";

const parser = new XMLParser({
  ignoreAttributes: false,
  htmlEntities: true,
  isArray: (name) => name === "item" || name === "entry" || name === "link" || name === "category",
});

type Node = Record<string, unknown>;
const text = (v: unknown): string =>
  typeof v === "object" && v !== null ? String((v as Node)["#text"] ?? "") : String(v ?? "");

/** Handles both RSS 2.0 (<item>) and Atom (<entry>) — the two formats engineering blogs use. */
export function parseFeed(xml: string, source: string, categories?: Category[]): RawArticle[] {
  const doc = parser.parse(xml);
  const items: Node[] = doc.rss?.channel?.item ?? doc.feed?.entry ?? [];
  return items.slice(0, 10).flatMap((it) => {
    const links = (it.link as unknown[]) ?? [];
    // RSS: <link>url</link>. Atom: <link href="url" rel="alternate"/>.
    const atomLink = links.find((l) => typeof l === "object" && (l as Node)["@_rel"] !== "self") as Node | undefined;
    const url = atomLink ? String(atomLink["@_href"]) : text(links[0]);
    const time = Date.parse(String(it.pubDate ?? it.published ?? it.updated));
    if (!url || Number.isNaN(time)) return []; // one malformed item must not sink the whole feed
    return [
      {
        id: `${source}:${url}`,
        title: text(it.title).trim(),
        url,
        source,
        points: 0,
        comments: 0,
        publishedAt: new Date(time).toISOString(),
        tags: ((it.category as unknown[]) ?? []).map((c) => text(c) || String((c as Node)["@_term"] ?? "")),
        categories,
      },
    ];
  });
}

export const rssSource = (name: string, url: string, categories?: Category[]): Source => ({
  name,
  fetch: async () => parseFeed(await getText(url), name, categories),
});
