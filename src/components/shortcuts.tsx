"use client";

// HN/Gmail-style keyboard navigation over whatever list of [data-article] items is on the page.
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const KEYS: [key: string, action: string][] = [
  ["j / k", "next / previous story"],
  ["o", "open story"],
  ["c", "open comments"],
  ["b", "save to reading list"],
  ["/  or  Ctrl K", "search & commands"],
  ["?", "this help"],
];

export function Shortcuts() {
  const help = useRef<HTMLDialogElement>(null);
  const pathname = usePathname(); // re-run on navigation so the selection resets on every page

  useEffect(() => {
    let index = -1;
    // Muted stories are display:none (offsetParent null) — skip them.
    const items = () => [...document.querySelectorAll<HTMLElement>("[data-article]")].filter((el) => el.offsetParent !== null);
    const select = (next: number) => {
      const list = items();
      if (!list.length) return;
      index = Math.max(0, Math.min(next, list.length - 1));
      list.forEach((el) => el.removeAttribute("data-selected"));
      list[index].setAttribute("data-selected", "");
      list[index].scrollIntoView({ block: "nearest" });
    };
    const click = (selector: string) => items()[index]?.querySelector<HTMLElement>(selector)?.click();

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable], dialog[open]")) return;
      if (e.key === "j") select(index + 1);
      else if (e.key === "k") select(index - 1);
      else if (e.key === "o") click("[data-open]");
      else if (e.key === "c") click("[data-comments]");
      else if (e.key === "b") click("[data-save]");
      else if (e.key === "/") window.dispatchEvent(new Event("devpulse:palette"));
      else if (e.key === "?") help.current?.showModal();
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pathname]);

  return (
    <dialog
      ref={help}
      onClick={(e) => e.target === help.current && help.current.close()}
      className="m-auto w-full max-w-sm rounded-xl border border-line bg-bg p-5 text-fg backdrop:bg-black/50"
    >
      <h2 className="mb-3 font-semibold">Keyboard shortcuts</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {KEYS.map(([key, action]) => (
          <div key={key} className="contents">
            <dt>
              <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-xs">{key}</kbd>
            </dt>
            <dd className="text-muted">{action}</dd>
          </div>
        ))}
      </dl>
      <form method="dialog" className="mt-4 text-right">
        <button className="rounded-lg border border-line px-3 py-1 text-sm hover:bg-surface">Close</button>
      </form>
    </dialog>
  );
}
