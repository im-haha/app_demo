import {ErrorContext, reportHandledError} from './reportError';

type ContextResolver<TArgs extends unknown[]> =
  | ErrorContext
  | ((...args: TArgs) => ErrorContext);

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as Promise<unknown>).then === 'function'
  );
}

function resolveContext<TArgs extends unknown[]>(
  context: ContextResolver<TArgs>,
  args: TArgs,
): ErrorContext {
  return typeof context === 'function' ? context(...args) : context;
}

export function withErrorCapture<TArgs extends unknown[]>(
  handler: (...args: TArgs) => unknown,
  context: ContextResolver<TArgs>,
): (...args: TArgs) => void {
  return (...args: TArgs) => {
    const errorContext = resolveContext(context, args);

    try {
      const result = handler(...args);
      if (isPromiseLike(result)) {
        void result.catch(error => {
          reportHandledError(error, errorContext);
        });
      }
    } catch (error) {
      reportHandledError(error, errorContext);
    }
  };
}

export async function runWithErrorCapture<T>(
  task: () => Promise<T> | T,
  context: ErrorContext,
): Promise<T> {
  try {
    return await task();
  } catch (error) {
    reportHandledError(error, context);
    throw error;
  }
}
