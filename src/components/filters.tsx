// Filters are plain links: every filtered view has a shareable URL and works without JS.
import Link from "next/link";

type Params = Record<string, string | number | boolean | undefined>;

/** "/repos" + {category: "mcp", page: 1, language: undefined} -> "/repos?category=mcp&page=1" */
export function hrefWith(path: string, params: Params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== false);
  const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
  return qs ? `${path}?${qs}` : path;
}

/** First value of a search param, or undefined. */
export const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** A value that must be one of `options`' keys, else the fallback. */
export function oneOf<T extends Record<string, unknown>>(v: string | undefined, options: T, fallback: keyof T & string) {
  return (v && Object.hasOwn(options, v) ? v : fallback) as keyof T & string;
}

export function Pills({ items, active, hrefFor }: { items: [key: string, label: string][]; active: string; hrefFor: (key: string) => string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([key, label]) => (
        <Link
          key={key}
          href={hrefFor(key)}
          aria-current={key === active ? "true" : undefined}
          className={`rounded-full border px-3 py-1 text-sm ${
            key === active ? "border-accent bg-accent text-bg" : "border-line text-muted hover:border-muted hover:text-fg"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
