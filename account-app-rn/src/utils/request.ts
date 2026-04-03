import {DATA_MODE} from './constants';

type RuntimeEnv = 'dev' | 'test' | 'staging' | 'prod';

const DEFAULT_REMOTE_BASE_URLS: Record<RuntimeEnv, string> = {
  dev: 'https://api-dev.example.com/api',
  test: 'https://api-test.example.com/api',
  staging: 'https://api-staging.example.com/api',
  prod: 'https://api.example.com/api',
};

function readEnv(name: string): string | undefined {
  const envMap = (globalThis as {process?: {env?: Record<string, string | undefined>}})
    .process?.env;
  const value = envMap?.[name];
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function resolveRuntimeEnv(): RuntimeEnv {
  const fromEnv = readEnv('APP_RUNTIME_ENV')?.toLowerCase();
  if (fromEnv === 'dev' || fromEnv === 'test' || fromEnv === 'staging' || fromEnv === 'prod') {
    return fromEnv;
  }
  return __DEV__ ? 'dev' : 'prod';
}

function resolveApiBaseUrl(): string {
  const explicitBaseUrl = readEnv('API_BASE_URL');
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }
  return DEFAULT_REMOTE_BASE_URLS[resolveRuntimeEnv()];
}

const API_BASE_URL = resolveApiBaseUrl();

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
