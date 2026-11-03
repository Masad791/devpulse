import { expect, it } from "vitest";
import { muteKey, PREFS_SCRIPT } from "./prefs";

it("normalizes text so mute rules match whole words and phrases", () => {
  expect(muteKey("Show HN: Next.js 16 — the GOOD parts.")).toBe("show hn next.js 16 the good parts");
  expect(muteKey('Crypto "pump"')).toBe("crypto pump");
  expect(` ${muteKey("Google ships Go 1.27")} `.includes(" go ")).toBe(true);
  expect(` ${muteKey("Google ships things")} `.includes(" go ")).toBe(false);
});

it("pre-paint script is valid JavaScript and builds the mute CSS", () => {
  const style = { id: "", textContent: "" };
  const attrs: Record<string, string> = {};
  const fakeDocument = {
    documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v), removeAttribute: () => {}, style: { setProperty: () => {}, removeProperty: () => {} } },
    getElementById: () => null,
    createElement: () => style,
    head: { appendChild: () => {} },
  };
  const fakeWindow: { __devpulseApply?: (p: object) => void } = {};
  const storage = { getItem: () => JSON.stringify({ theme: "nord", muteWords: ["crypto"], muteSources: ['Dev.to"]{x}'] }) };
  new Function("window", "document", "localStorage", PREFS_SCRIPT)(fakeWindow, fakeDocument, storage);
  expect(attrs["data-theme"]).toBe("nord");
  expect(style.textContent).toBe('[data-source="Dev.to]{x}"],[data-title*=" crypto "]{display:none!important}');
});
