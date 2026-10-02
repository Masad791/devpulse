// Every upstream call goes through here: one timeout, one User-Agent, one cache policy.
export const REVALIDATE_SECONDS = 900; // 15 min: upstream is hit at most this often, no matter the traffic

async function get(url: string, headers: Record<string, string> = {}): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": "DevPulse (+https://github.com/Masad791/devpulse)", ...headers },
    signal: AbortSignal.timeout(8000), // a slow source must not stall the whole page
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} <- ${url}`);
  return res;
}

export const getJson = async <T>(url: string, headers?: Record<string, string>): Promise<T> =>
  (await get(url, headers)).json() as Promise<T>;

export const getText = async (url: string): Promise<string> => (await get(url)).text();
