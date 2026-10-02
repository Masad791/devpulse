// Every upstream call goes through here: one timeout, one User-Agent, one cache policy.
export const REVALIDATE_SECONDS = 300; // upstream is hit at most every 5 min, no matter the traffic

type Options = { headers?: Record<string, string>; revalidate?: number };

async function get(url: string, { headers = {}, revalidate = REVALIDATE_SECONDS }: Options = {}): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": "DevPulse (+https://github.com/Masad791/devpulse)", ...headers },
    signal: AbortSignal.timeout(8000), // a slow source must not stall the whole page
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} <- ${url}`);
  return res;
}

export const getJson = async <T>(url: string, options?: Options): Promise<T> =>
  (await get(url, options)).json() as Promise<T>;

export const getText = async (url: string, options?: Options): Promise<string> => (await get(url, options)).text();
