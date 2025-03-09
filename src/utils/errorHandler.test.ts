import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleError, withErrorHandling } from './errorHandler';

// Mock the chrome-polyfill module
vi.mock('./chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Error Handler Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('handleError', () => {
    it('should format error message with context', () => {
      const error = new Error('Test error');
      const context = 'Test Context';

      const result = handleError(error, context);

      expect(result).toBe('Test Context: Test error');
    });

    it('should handle undefined error message', () => {
      const error = new Error();
      const context = 'Test Context';

      const result = handleError(error, context);

      expect(result).toBe('Test Context: An unknown error occurred');
    });

    it('should call custom logError function if provided', () => {
      const error = new Error('Test error');
      const context = 'Test Context';
      const logError = vi.fn();

      handleError(error, context, undefined, logError);

      expect(logError).toHaveBeenCalledWith('Test Context: Test error', error);
    });

    it('should call setStatusMessage if provided', () => {
      const error = new Error('Test error');
      const context = 'Test Context';
      const setStatusMessage = vi.fn();

      handleError(error, context, setStatusMessage);

      expect(setStatusMessage).toHaveBeenCalledWith({
        text: 'Test Context: Test error',
        type: 'error',
      });
    });
  });

  describe('withErrorHandling', () => {
    it('should return result of successful function', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      const wrappedFn = withErrorHandling(successFn);

      const result = await wrappedFn();

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalled();
    });

    it('should handle errors and return error object', async () => {
      const error = new Error('Test error');
      const failingFn = vi.fn().mockRejectedValue(error);
      const wrappedFn = withErrorHandling(failingFn);

      const result = await wrappedFn();

      expect(result).toEqual({
        success: false,
        error: 'Error: Test error',
      });
    });

    it('should use provided context in error message', async () => {
      const error = new Error('Test error');
      const failingFn = vi.fn().mockRejectedValue(error);
      const wrappedFn = withErrorHandling(failingFn, { context: 'Custom Context' });

      const result = await wrappedFn();

      expect(result).toEqual({
        success: false,
        error: 'Custom Context: Test error',
      });
    });

    it('should call setStatusMessage with error details', async () => {
      const error = new Error('Test error');
      const failingFn = vi.fn().mockRejectedValue(error);
      const setStatusMessage = vi.fn();
      const wrappedFn = withErrorHandling(failingFn, {
        context: 'Custom Context',
        setStatusMessage,
      });

      await wrappedFn();

      expect(setStatusMessage).toHaveBeenCalledWith({
        text: 'Custom Context: Test error',
        type: 'error',
      });
    });

    it('should call logError with error details', async () => {
      const error = new Error('Test error');
      const failingFn = vi.fn().mockRejectedValue(error);
      const logError = vi.fn();
      const wrappedFn = withErrorHandling(failingFn, {
        context: 'Custom Context',
        logError,
      });

      await wrappedFn();

      expect(logError).toHaveBeenCalledWith('Custom Context: Test error', error);
    });

    it('should call onError callback if provided', async () => {
      const error = new Error('Test error');
      const failingFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();
      const wrappedFn = withErrorHandling(failingFn, {
        context: 'Custom Context',
        onError,
      });

      await wrappedFn();

      expect(onError).toHaveBeenCalledWith(error, 'Custom Context: Test error');
    });

    it('should pass arguments to the wrapped function', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      const wrappedFn = withErrorHandling(successFn);

      await wrappedFn('arg1', 'arg2', 123);

      expect(successFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });
  });
});
