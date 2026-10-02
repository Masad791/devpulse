"use client";

import { useMemo, useSyncExternalStore } from "react";
import { EVENT, KEY, type Prefs } from "./prefs";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "{}";
  } catch {
    return "{}"; // storage blocked (private mode, sandboxed iframe): just use defaults
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

/** null during SSR/hydration (the server can't know), the saved prefs after. */
export function usePrefs(): Prefs | null {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return useMemo(() => {
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as Prefs;
    } catch {
      return {};
    }
  }, [raw]);
}

export function savePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // still apply for this page view
  }
  window.__devpulseApply?.(prefs);
  window.dispatchEvent(new Event(EVENT));
}
