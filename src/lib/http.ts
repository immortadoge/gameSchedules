export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`Request to ${url} failed with status ${status}`);
    this.name = 'HttpError';
  }
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export interface RequestOptions {
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function fetchJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query);
  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...options.headers },
    ...(options.signal ? { signal: options.signal } : {}),
  });
  if (!response.ok) throw new HttpError(response.status, url);
  return (await response.json()) as T;
}

export async function fetchText(path: string, options: RequestOptions = {}): Promise<string> {
  const url = buildUrl(path, options.query);
  const response = await fetch(url, {
    headers: { Accept: 'text/html', ...options.headers },
    ...(options.signal ? { signal: options.signal } : {}),
  });
  if (!response.ok) throw new HttpError(response.status, url);
  return await response.text();
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function describeError(error: unknown): string {
  if (error instanceof HttpError) return `HTTP ${error.status}`;
  if (error instanceof Error) return error.message;
  return String(error);
}
