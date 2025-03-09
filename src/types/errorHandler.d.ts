declare module '../utils/errorHandler' {
  export function withErrorHandling<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    options: {
      context: string;
      setStatusMessage: (msg: { text: string; type: string }) => void;
      logError: (message: string, error?: any) => void;
    },
  ): (...args: Args) => Promise<T>;
}
