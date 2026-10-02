/**
 * Like Promise.allSettled, but with at most `limit` tasks in flight.
 * Firing 75 upstream requests at once trips timeouts and rate limits; 10 at a time finishes nearly as fast.
 */
export async function allSettledPool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++; // safe: JS runs this synchronously, no two workers get the same i
      try {
        results[i] = { status: "fulfilled", value: await tasks[i]() };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
