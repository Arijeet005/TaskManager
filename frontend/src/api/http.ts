const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.toString() || 'http://localhost:8000';

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers);
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    let detail: any = undefined;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  return (await res.json()) as T;
}

