import * as Sentry from '@sentry/react-native';

type SentryOptionsGlobal = {
  dsn?: string;
};

const DEFAULT_SENTRY_DSN =
  'https://b239fbad0418605b7d10e9a169c73d93@o4509377255768064.ingest.us.sentry.io/4511159444439040';

function resolveSentryDsn(): string {
  const maybeOptions = (globalThis as {__SENTRY_OPTIONS__?: SentryOptionsGlobal})
    .__SENTRY_OPTIONS__;
  const optionsDsn = maybeOptions?.dsn;

  if (typeof optionsDsn === 'string' && optionsDsn.trim().length > 0) {
    return optionsDsn.trim();
  }

  const processEnvDsn = (globalThis as {process?: {env?: {SENTRY_DSN?: string}}})
    .process?.env?.SENTRY_DSN;
  if (typeof processEnvDsn === 'string' && processEnvDsn.trim().length > 0) {
    return processEnvDsn.trim();
  }

  return DEFAULT_SENTRY_DSN;
}

const SENTRY_DSN = resolveSentryDsn();

let isSentryInitialized = false;

function getSentryEnabled(): boolean {
  return !__DEV__ && Boolean(SENTRY_DSN);
}

export function initSentry(): void {
  if (isSentryInitialized) {
    return;
  }

  isSentryInitialized = true;

  Sentry.init({
    dsn: SENTRY_DSN || undefined,
    enabled: getSentryEnabled(),
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event, hint) {
      const message =
        event.message ??
        (hint?.originalException instanceof Error
          ? hint.originalException.message
          : String(hint?.originalException ?? ''));

      if (/Network request failed|AbortError/i.test(message)) {
        return null;
      }

      return event;
    },
  });

  if (!SENTRY_DSN) {
    console.warn(
      '[sentry] DSN is empty. Configure sentry.options.json dsn or SENTRY_DSN.',
    );
  }
}

export {Sentry};

initSentry();
