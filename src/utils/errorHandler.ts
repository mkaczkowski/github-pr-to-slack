import { debug } from './chrome-polyfill';

interface StatusMessageType {
  text: string;
  type: string;
}

interface ErrorHandlerOptions {
  context?: string;
  setStatusMessage?: (msg: StatusMessageType) => void;
  logError?: (message: string, error: Error) => void;
  onError?: (error: Error, message: string) => void;
}

export const handleError = (
  error: Error,
  context: string,
  setStatusMessage?: (msg: StatusMessageType) => void,
  logError?: (message: string, error: Error) => void,
): string => {
  const errorMessage = error?.message || 'An unknown error occurred';
  const formattedMessage = `${context}: ${errorMessage}`;

  if (logError && typeof logError === 'function') {
    logError(formattedMessage, error);
  } else {
    debug.error('ErrorHandler', formattedMessage, error);
  }

  if (setStatusMessage && typeof setStatusMessage === 'function') {
    setStatusMessage({
      text: formattedMessage,
      type: 'error',
    });
  }

  return formattedMessage;
};

export const withErrorHandling = <Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: ErrorHandlerOptions = {},
): ((...args: Args) => Promise<Result | { success: false; error: string }>) => {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorMessage = handleError(
        error as Error,
        options.context || 'Error',
        options.setStatusMessage,
        options.logError,
      );

      if (options.onError && typeof options.onError === 'function') {
        options.onError(error as Error, errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      } as { success: false; error: string };
    }
  };
};
