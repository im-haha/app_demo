function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function appendHint(rel: 'preconnect' | 'dns-prefetch', href: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const marker = `data-hint-${rel}`;
  if (document.head.querySelector(`link[${marker}="${href}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  link.setAttribute(marker, href);

  if (rel === 'preconnect') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

export function warmupApiOrigin(apiBaseUrl: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const parsed = safeParseUrl(apiBaseUrl);
  if (!parsed) {
    return;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return;
  }

  appendHint('dns-prefetch', parsed.origin);
  appendHint('preconnect', parsed.origin);
}
