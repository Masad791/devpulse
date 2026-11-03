"use client";

export function SearchButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("devpulse:palette"))}
      className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-accent/60 hover:text-fg"
      aria-label="Search (Ctrl+K)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="hidden lg:inline">Search</span>
      <kbd className="hidden rounded border border-line px-1 font-mono text-[10px] lg:inline">Ctrl K</kbd>
    </button>
  );
}
