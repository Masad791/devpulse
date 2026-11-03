"use client";

// Reading list in localStorage (no account). Same pattern as use-prefs: an external store React subscribes to.
import { useMemo, useSyncExternalStore } from "react";

export type SavedArticle = { id: string; title: string; url: string; source: string; publishedAt: string; savedAt: string };

const KEY = "devpulse:saved";
const EVENT = "devpulse:saved";
const MAX = 300;

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** null while hydrating (the server can't know), the list after. */
export function useSaved(): SavedArticle[] | null {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return useMemo(() => {
    if (raw === null) return null;
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? (list as SavedArticle[]) : [];
    } catch {
      return [];
    }
  }, [raw]);
}

export function toggleSaved(article: Omit<SavedArticle, "savedAt">) {
  const list: SavedArticle[] = JSON.parse(read());
  const next = list.some((a) => a.id === article.id)
    ? list.filter((a) => a.id !== article.id)
    : [{ ...article, savedAt: new Date().toISOString() }, ...list].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: nothing we can do
  }
  window.dispatchEvent(new Event(EVENT));
}
