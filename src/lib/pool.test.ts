import { expect, it } from "vitest";
import { allSettledPool } from "./pool";

it("keeps order, isolates failures, and never exceeds the limit", async () => {
  let running = 0;
  let peak = 0;
  const task = (value: number) => async () => {
    peak = Math.max(peak, ++running);
    await new Promise((r) => setTimeout(r, 5));
    running--;
    if (value === 3) throw new Error("boom");
    return value;
  };

  const results = await allSettledPool([1, 2, 3, 4, 5, 6].map(task), 2);

  expect(peak).toBe(2);
  expect(results.map((r) => (r.status === "fulfilled" ? r.value : "x"))).toEqual([1, 2, "x", 4, 5, 6]);
});
