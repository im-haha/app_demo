import {Sentry} from './sentry';

type ErrorContext = {
  screen?: string;
  action?: string;
  feature?: string;
  extra?: Record<string, unknown>;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error('Unknown error');
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  const normalizedError = normalizeError(error);

  Sentry.withScope(scope => {
    if (context.screen) {
      scope.setTag('screen', context.screen);
    }

    if (context.action) {
      scope.setTag('action', context.action);
    }

    if (context.feature) {
      scope.setTag('feature', context.feature);
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel('error');
    Sentry.captureException(normalizedError);
  });
}

export function reportHandledError(
  error: unknown,
  context: ErrorContext = {},
): void {
  reportError(error, context);
}

export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}
