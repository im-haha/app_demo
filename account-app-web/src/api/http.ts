import type {ApiResponse} from 'account-app-shared';
import {API_BASE_URL} from './config';

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  token?: string | null;
  query?: Record<string, QueryValue>;
  body?: unknown;
  timeoutMs?: number;
}

function withTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, withTrailingSlash(API_BASE_URL));

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
  {token, query, body, headers, timeoutMs = 10000, ...rest}: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path, query), {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        ...(headers ?? {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`);
    }

    const result = (await response.json()) as ApiResponse<T>;
    if (typeof result?.code === 'number' && result.code !== 200) {
      throw new Error(result.message || '请求失败');
    }

    return result.data;
  } finally {
    window.clearTimeout(timer);
  }
}
