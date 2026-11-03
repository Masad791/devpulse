"use client";

import { useEffect } from "react";

/**
 * One delegated listener for the whole site: when a reader opens a story ([data-track] link), send its id
 * with navigator.sendBeacon — fire-and-forget, survives the page navigating away, never delays the click.
 * Sends nothing else: no cookie, no user id.
 */
export function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[data-track]");
      if (link?.dataset.track) {
        navigator.sendBeacon("/api/click", new Blob([JSON.stringify({ id: link.dataset.track })], { type: "application/json" }));
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("auxclick", onClick); // middle-click "open in new tab"
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("auxclick", onClick);
    };
  }, []);
  return null;
}
