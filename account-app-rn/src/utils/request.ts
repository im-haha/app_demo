import {DATA_MODE} from './constants';

const API_BASE_URL = 'http://localhost:8080/api';

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends RequestInit {
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path, API_BASE_URL);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    url.searchParams.append(key, String(value));
  });

  return url.toString();
}

export async function request<T>(
  path: string,
  {query, timeoutMs = 10000, headers, ...init}: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path, query), {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function isLocalMode(): boolean {
  return DATA_MODE === 'local';
}
