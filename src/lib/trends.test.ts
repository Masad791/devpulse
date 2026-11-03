import { expect, it } from "vitest";
import { computeTrends } from "./trends";

const NOW = Date.parse("2026-10-10T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
const item = (title: string, d: number) => ({ title, tags: [], publishedAt: daysAgo(d) });
const filler = (n: number, d: number) => Array.from({ length: n }, (_, i) => item(`Unrelated story ${i}`, d));

it("buckets mentions by day and ignores substrings and old items", () => {
  const trends = computeTrends(
    [item("Rust 1.99 is out", 0), item("Why we rewrote it in Rust", 1), item("Trust issues", 0), item("Rust from long ago", 40)],
    NOW,
  );
  const rust = trends.find((t) => t.label === "Rust")!;
  expect(rust.thisWeek).toBe(2);
  expect(rust.daily.at(-1)).toBe(1); // today
  expect(rust.daily).toHaveLength(28);
});

it("measures change as share of all stories, so more stories overall is not a 'rise'", () => {
  // Last week: 3 Rust out of 30 stories (10%). This week: 6 Rust out of 60 stories (still 10%).
  const items = [
    ...Array.from({ length: 3 }, () => item("Rust news", 9)),
    ...filler(27, 9),
    ...Array.from({ length: 6 }, () => item("Rust news", 2)),
    ...filler(54, 2),
  ];
  const rust = computeTrends(items, NOW).find((t) => t.label === "Rust")!;
  expect(rust).toMatchObject({ thisWeek: 6, lastWeek: 3 });
  expect(rust.change).toBeCloseTo(0); // raw counts doubled, share did not

  // Same volume, double the share -> +100%.
  const doubled = [...Array.from({ length: 3 }, () => item("Rust news", 9)), ...filler(27, 9), ...Array.from({ length: 6 }, () => item("Rust news", 2)), ...filler(24, 2)];
  expect(computeTrends(doubled, NOW).find((t) => t.label === "Rust")!.change).toBeCloseTo(1);
});

it("reports null change when last week's baseline is too small", () => {
  const trends = computeTrends([item("Zig 0.16 released", 1), item("Zig again", 9)], NOW);
  expect(trends.find((t) => t.label === "Zig")).toMatchObject({ thisWeek: 1, lastWeek: 1, change: null });
});
