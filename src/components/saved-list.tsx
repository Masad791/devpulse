"use client";

import { domain } from "@/lib/format";
import { toggleSaved, useSaved } from "@/lib/use-saved";

export function SavedList() {
  const saved = useSaved();
  if (saved === null) return null; // hydrating
  if (!saved.length) return <p className="py-16 text-center text-muted">Nothing saved yet.</p>;
  return (
    <ol className="mt-5 divide-y divide-line">
      {saved.map((a) => (
        <li key={a.id} data-article className="flex items-start gap-3 py-3.5">
          <div className="min-w-0 flex-1">
            <a href={a.url} target="_blank" rel="noopener noreferrer" data-open data-track={a.id} className="font-medium leading-snug visited:text-muted hover:text-accent">
              {a.title}
            </a>
            <p className="text-xs text-muted">
              {a.source} · {domain(a.url)} · saved {new Date(a.savedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </p>
          </div>
          <button data-save onClick={() => toggleSaved(a)} className="shrink-0 text-xs text-muted hover:text-fg">
            Remove
          </button>
        </li>
      ))}
    </ol>
  );
}
