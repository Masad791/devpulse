import Link from "next/link";

/** 1 … 4 5 [6] 7 8 … 10 — always first, last, and two either side of the current page. */
export function pageWindow(page: number, totalPages: number): (number | "…")[] {
  const pages = new Set([1, totalPages]);
  for (let p = page - 2; p <= page + 2; p++) if (p >= 1 && p <= totalPages) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["…" as const, p] : [p]));
}

export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const cell = "grid h-9 min-w-9 place-items-center rounded-lg px-3 text-sm";
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={`${cell} text-muted hover:bg-surface hover:text-fg`}>
          ← Newer
        </Link>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap${i}`} className={`${cell} text-muted`}>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${cell} ${p === page ? "bg-fg font-semibold text-bg" : "text-muted hover:bg-surface hover:text-fg"}`}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link href={hrefFor(page + 1)} className={`${cell} text-muted hover:bg-surface hover:text-fg`}>
          Older →
        </Link>
      )}
    </nav>
  );
}
