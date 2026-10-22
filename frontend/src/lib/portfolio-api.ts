export interface PortfolioPayload {
  profile?: Record<string, unknown>;
  projects?: unknown[];
  skills?: unknown[];
  focusAreas?: unknown[];
}

export async function fetchPortfolio(url: string, signal: AbortSignal): Promise<PortfolioPayload> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) controller.abort();
  // Leave time for the hosted backend to wake up without hanging indefinitely.
  const timeout = window.setTimeout(abort, 20000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Portfolio request failed (${response.status}).`);
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Portfolio API returned a page instead of JSON. Check VITE_API_URL.');
    }
    const data = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        !['projects', 'skills', 'focusAreas'].every((key) => Array.isArray(data[key]))) {
      throw new Error('Portfolio API returned incomplete data.');
    }
    return data;
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

export function mergeProfile<T extends object>(defaults: T, incoming: Record<string, unknown>): T {
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    if (typeof incoming[key as string] === 'string') result[key] = incoming[key as string] as T[keyof T];
  }
  return result;
}
