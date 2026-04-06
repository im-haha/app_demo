import * as Sentry from '@sentry/react-native';

type SentryOptionsGlobal = {
  dsn?: string;
  environment?: string;
  release?: string;
  dist?: string;
  enableSmokeTest?: boolean;
};

type SentryEnv = {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_RELEASE?: string;
  SENTRY_DIST?: string;
  SENTRY_SMOKE_TEST?: string;
};

const DEFAULT_SENTRY_DSN =
  'https://b239fbad0418605b7d10e9a169c73d93@o4509377255768064.ingest.us.sentry.io/4511159444439040';
const DEFAULT_SENTRY_ENVIRONMENT = 'production';
const DEFAULT_SENTRY_RELEASE = 'com.accountappshell076@1.0.2+3';
const DEFAULT_SENTRY_DIST = '3';

function getSentryOptionsGlobal(): SentryOptionsGlobal | undefined {
  return (globalThis as {__SENTRY_OPTIONS__?: SentryOptionsGlobal}).__SENTRY_OPTIONS__;
}

function getProcessEnv(): SentryEnv | undefined {
  return (globalThis as {process?: {env?: SentryEnv}}).process?.env;
}

function resolveSentryDsn(): string {
  const maybeOptions = getSentryOptionsGlobal();
  const optionsDsn = maybeOptions?.dsn;

  if (typeof optionsDsn === 'string' && optionsDsn.trim().length > 0) {
    return optionsDsn.trim();
  }

  const processEnvDsn = getProcessEnv()?.SENTRY_DSN;
  if (typeof processEnvDsn === 'string' && processEnvDsn.trim().length > 0) {
    return processEnvDsn.trim();
  }

  return DEFAULT_SENTRY_DSN;
}

function resolveSentryEnvironment(): string {
  const optionsEnvironment = getSentryOptionsGlobal()?.environment;
  if (
    typeof optionsEnvironment === 'string' &&
    optionsEnvironment.trim().length > 0
  ) {
    return optionsEnvironment.trim();
  }

  const processEnvEnvironment = getProcessEnv()?.SENTRY_ENVIRONMENT;
  if (
    typeof processEnvEnvironment === 'string' &&
    processEnvEnvironment.trim().length > 0
  ) {
    return processEnvEnvironment.trim();
  }

  return DEFAULT_SENTRY_ENVIRONMENT;
}

function resolveSentryRelease(): string {
  const optionsRelease = getSentryOptionsGlobal()?.release;
  if (typeof optionsRelease === 'string' && optionsRelease.trim().length > 0) {
    return optionsRelease.trim();
  }

  const processEnvRelease = getProcessEnv()?.SENTRY_RELEASE;
  if (typeof processEnvRelease === 'string' && processEnvRelease.trim().length > 0) {
    return processEnvRelease.trim();
  }

  return DEFAULT_SENTRY_RELEASE;
}

function resolveSentryDist(): string {
  const optionsDist = getSentryOptionsGlobal()?.dist;
  if (typeof optionsDist === 'string' && optionsDist.trim().length > 0) {
    return optionsDist.trim();
  }

  const processEnvDist = getProcessEnv()?.SENTRY_DIST;
  if (typeof processEnvDist === 'string' && processEnvDist.trim().length > 0) {
    return processEnvDist.trim();
  }

  return DEFAULT_SENTRY_DIST;
}

function shouldEnableSmokeTest(): boolean {
  const optionsSmokeTest = getSentryOptionsGlobal()?.enableSmokeTest;
  if (typeof optionsSmokeTest === 'boolean') {
    return optionsSmokeTest;
  }

  const processEnvSmokeTest = getProcessEnv()?.SENTRY_SMOKE_TEST;
  if (typeof processEnvSmokeTest === 'string') {
    return processEnvSmokeTest.trim().toLowerCase() === 'true';
  }

  return false;
}

const SENTRY_DSN = resolveSentryDsn();
const SENTRY_ENVIRONMENT = resolveSentryEnvironment();
const SENTRY_RELEASE = resolveSentryRelease();
const SENTRY_DIST = resolveSentryDist();
const SENTRY_RUNTIME_ENABLED = !__DEV__ && Boolean(SENTRY_DSN);

let isSentryInitialized = false;
let isSmokeTestScheduled = false;

function getSentryEnabled(): boolean {
  return SENTRY_RUNTIME_ENABLED;
}

function scheduleSmokeTestIfNeeded(): void {
  if (isSmokeTestScheduled || __DEV__ || !shouldEnableSmokeTest()) {
    return;
  }

  isSmokeTestScheduled = true;
  setTimeout(() => {
    Sentry.captureException(new Error('Sentry release smoke test'));
  }, 3000);
}

export function initSentry(): void {
  if (isSentryInitialized) {
    return;
  }

  if (!SENTRY_RUNTIME_ENABLED) {
    return;
  }

  isSentryInitialized = true;

  Sentry.init({
    dsn: SENTRY_DSN || undefined,
    enabled: getSentryEnabled(),
    debug: false,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    dist: SENTRY_DIST,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });

  scheduleSmokeTestIfNeeded();

  if (!SENTRY_DSN) {
    console.warn(
      '[sentry] DSN is empty. Configure sentry.options.json dsn or SENTRY_DSN.',
    );
  }
}

export {Sentry};
export {SENTRY_RUNTIME_ENABLED};

initSentry();
