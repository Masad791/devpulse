"use client";

import { useRef } from "react";
import { ACCENTS, THEMES, type Prefs } from "@/lib/prefs";
import { savePrefs, usePrefs } from "@/lib/use-prefs";
import { CATEGORIES, type Category } from "@/lib/types";
import { Sliders } from "./icons";

export function Customize() {
  const dialog = useRef<HTMLDialogElement>(null);
  const prefs = usePrefs() ?? {};
  const set = (patch: Partial<Prefs>) => savePrefs({ ...prefs, ...patch });
  const topics = prefs.topics ?? [];
  const toggleTopic = (c: Category) => set({ topics: topics.includes(c) ? topics.filter((t) => t !== c) : [...topics, c] });

  return (
    <>
      <button
        onClick={() => dialog.current?.showModal()}
        className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-accent/60 hover:text-fg"
      >
        <Sliders className="size-4" />
        <span className="hidden sm:inline">Customize</span>
      </button>

      {/* Native <dialog>: focus trap, Esc to close, and ::backdrop for free. */}
      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        aria-label="Customize"
        className="fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-sm overflow-y-auto border-l border-line bg-bg p-0 text-fg backdrop:bg-black/50"
      >
        <div className="space-y-7 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Customize</h2>
            <form method="dialog">
              <button className="rounded-md px-2 py-1 text-muted hover:bg-surface hover:text-fg" aria-label="Close">
                ✕
              </button>
            </form>
          </div>

          <Section title="Theme">
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => {
                const active = (prefs.theme ?? "system") === t.id;
                const [bg, fg, accent] = t.swatch;
                return (
                  <button
                    key={t.id}
                    onClick={() => set({ theme: t.id })}
                    aria-pressed={active}
                    className={`rounded-lg border p-1.5 text-left text-xs ${active ? "border-accent ring-1 ring-accent" : "border-line hover:border-muted"}`}
                  >
                    <span className="mb-1.5 block h-10 rounded-md p-1.5" style={{ background: bg }}>
                      <span className="block h-1.5 w-3/4 rounded-full" style={{ background: fg }} />
                      <span className="mt-1 block h-1.5 w-1/2 rounded-full opacity-50" style={{ background: fg }} />
                      <span className="mt-1 block h-1.5 w-1/4 rounded-full" style={{ background: accent }} />
                    </span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Accent color">
            <div className="flex flex-wrap items-center gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => set({ accent: c })}
                  aria-label={`Accent ${c}`}
                  aria-pressed={prefs.accent === c}
                  className={`size-7 rounded-full ${prefs.accent === c ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : ""}`}
                  style={{ background: c }}
                />
              ))}
              <label className="relative size-7 cursor-pointer overflow-hidden rounded-full border border-dashed border-muted" title="Custom color">
                <input
                  type="color"
                  value={prefs.accent ?? "#059669"}
                  onChange={(e) => set({ accent: e.target.value })}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <span className="grid size-full place-items-center text-xs text-muted">+</span>
              </label>
              {prefs.accent && (
                <button onClick={() => set({ accent: undefined })} className="text-xs text-muted underline">
                  theme default
                </button>
              )}
            </div>
          </Section>

          <Section title="Layout">
            <Segmented value={prefs.layout ?? "list"} options={["list", "cards"]} onChange={(layout) => set({ layout })} />
          </Section>
          <Section title="Density">
            <Segmented value={prefs.density ?? "comfortable"} options={["comfortable", "compact"]} onChange={(density) => set({ density })} />
          </Section>
          <Section title="Font">
            <Segmented value={prefs.font ?? "sans"} options={["sans", "mono"]} onChange={(font) => set({ font })} />
          </Section>

          <Section title="Your topics" hint="Builds your “For you” feed.">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORIES) as Category[]).map((c) => {
                const on = topics.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleTopic(c)}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1 text-xs ${on ? "border-accent bg-accent text-bg" : "border-line text-muted hover:text-fg"}`}
                  >
                    {CATEGORIES[c]}
                  </button>
                );
              })}
            </div>
          </Section>

          <button onClick={() => savePrefs({})} className="text-sm text-muted underline hover:text-fg">
            Reset everything
          </button>
        </div>
      </dialog>
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-medium">{title}</h3>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line p-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`rounded-md px-3 py-1 text-sm capitalize ${value === o ? "bg-surface font-medium text-fg" : "text-muted hover:text-fg"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
