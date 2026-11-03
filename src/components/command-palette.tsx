"use client";

// Ctrl/Cmd+K: search every stored article (Postgres full-text via /api/search) and jump anywhere.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { THEMES } from "@/lib/prefs";
import { CATEGORIES, type Article } from "@/lib/types";
import { savePrefs, usePrefs } from "@/lib/use-prefs";

type Item = { key: string; label: string; hint: string; run: () => void };

const PAGES: [label: string, href: string][] = [
  ["Top stories", "/"],
  ["For you", "/for-you"],
  ...Object.entries(CATEGORIES).map(([slug, label]): [string, string] => [label, `/${slug}`]),
  ["Buzz — engineers on Bluesky & Mastodon", "/buzz"],
  ["Trending repos", "/repos"],
  ["Release radar", "/releases"],
  ["Discussions", "/discussions"],
  ["Contribute to open source", "/contribute"],
  ["Trend radar", "/trends"],
  ["Weekly digest", "/digest"],
  ["Reading list", "/saved"],
  ["Status", "/status"],
];

export function CommandPalette() {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const prefs = usePrefs();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<{ q: string; articles: Article[] } | null>(null);

  // Open from anywhere: Ctrl/Cmd+K, the "/" shortcut, or the header search button.
  useEffect(() => {
    const open = () => dialog.current?.showModal();
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("devpulse:palette", open);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("devpulse:palette", open);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Debounced search: wait 200 ms after typing stops, so we don't fire a request per keystroke.
  useEffect(() => {
    if (q.trim().length < 2) return;
    const timer = setTimeout(() => {
      fetch(`/api/search?${new URLSearchParams({ q })}`)
        .then((r) => (r.ok ? r.json() : { q, articles: [] }))
        .then((data: { articles: Article[] }) => setResults({ q, articles: data.articles ?? [] }))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  const close = () => dialog.current?.close();
  const needle = q.trim().toLowerCase();
  const go = (href: string) => () => {
    close();
    router.push(href);
  };
  const items: Item[] = [
    ...PAGES.filter(([label]) => !needle || label.toLowerCase().includes(needle))
      .slice(0, needle ? 4 : 8)
      .map(([label, href]) => ({ key: href, label, hint: "Go to", run: go(href) })),
    ...THEMES.filter((t) => needle.length > 1 && `theme ${t.label}`.toLowerCase().includes(needle)).map((t) => ({
      key: `theme-${t.id}`,
      label: `${t.label} theme`,
      hint: "Switch",
      run: () => savePrefs({ ...(prefs ?? {}), theme: t.id }),
    })),
    ...(results && results.q === q && needle.length > 1 ? results.articles : []).map((a) => ({
      key: a.id,
      label: a.title,
      hint: a.source,
      run: () => {
        close();
        window.open(a.url, "_blank", "noopener");
      },
    })),
  ];
  const searching = needle.length > 1 && results?.q !== q;

  return (
    <dialog
      ref={dialog}
      onClick={(e) => e.target === dialog.current && close()}
      onClose={() => {
        setQ("");
        setActive(0);
      }}
      aria-label="Search and commands"
      className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-xl border border-line bg-bg p-0 text-fg shadow-2xl backdrop:bg-black/50"
    >
      <input
        autoFocus
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, items.length - 1));
          else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
          else if (e.key === "Enter") items[active]?.run();
          else return;
          e.preventDefault();
        }}
        placeholder="Search stories, jump to a page, switch theme…"
        aria-label="Search"
        className="w-full border-b border-line bg-transparent px-4 py-3.5 text-base outline-none placeholder:text-muted"
      />
      <ul className="max-h-[55vh] overflow-y-auto p-1.5" role="listbox">
        {items.map((item, i) => (
          <li key={item.key} role="option" aria-selected={i === active}>
            <button
              onClick={item.run}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === active ? "bg-surface" : ""}`}
            >
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 text-xs text-muted">{item.hint}</span>
            </button>
          </li>
        ))}
        {searching && <li className="px-3 py-2 text-sm text-muted">Searching…</li>}
        {!searching && needle.length > 1 && results?.articles.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted">No stories match “{q}”.</li>
        )}
      </ul>
      <p className="border-t border-line px-4 py-2 text-[11px] text-muted">↑↓ to move · Enter to open · Esc to close · press ? on any page for shortcuts</p>
    </dialog>
  );
}
