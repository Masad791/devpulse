"use client";

import { toggleSaved, useSaved, type SavedArticle } from "@/lib/use-saved";

export function SaveButton({ article }: { article: Omit<SavedArticle, "savedAt"> }) {
  const saved = useSaved();
  const on = saved?.some((a) => a.id === article.id) ?? false;
  return (
    <button
      type="button"
      data-save
      onClick={() => toggleSaved(article)}
      aria-pressed={on}
      title={on ? "Remove from reading list (b)" : "Save to reading list (b)"}
      className={`inline-flex items-center gap-1 hover:text-fg ${on ? "text-accent" : ""}`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
      {on ? "Saved" : "Save"}
    </button>
  );
}
