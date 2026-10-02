"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Keeps an open tab fresh: every few minutes, re-fetch this page's server render. Because pages are
 * ISR-cached, that's a cheap CDN hit, not a re-run of 50 upstream fetches. Paused while the tab is hidden.
 */
export function AutoRefresh({ seconds = 300 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => document.visibilityState === "visible" && router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
