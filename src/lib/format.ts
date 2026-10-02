const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow" });

/** `now` is passed in (not Date.now()) so server and client render the same text — no hydration mismatch. */
export function timeAgo(iso: string, now: number) {
  const minutes = Math.round((Date.parse(iso) - now) / 60_000);
  if (minutes > -60) return rtf.format(Math.min(minutes, 0), "minute");
  if (minutes > -60 * 48) return rtf.format(Math.round(minutes / 60), "hour");
  return rtf.format(Math.round(minutes / 1440), "day");
}

export function domain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Small favicon per site. DuckDuckGo's icon service doesn't need a key and doesn't track. */
export const favicon = (url: string) => `https://icons.duckduckgo.com/ip3/${domain(url)}.ico`;

const compact = new Intl.NumberFormat("en", { notation: "compact" });
export const count = (n: number) => compact.format(n);
