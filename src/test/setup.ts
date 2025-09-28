import '@testing-library/jest-dom';
import { vi, afterAll } from 'vitest';
import { chromeMock } from './mocks/chrome';

// Make vi available globally
globalThis.vi = vi;

// Setup Chrome API mocks
globalThis.chrome = chromeMock as unknown as typeof chrome;

// Mock fetch API
globalThis.fetch = vi.fn() as unknown as typeof fetch;
globalThis.Request = vi.fn() as unknown as typeof Request;
globalThis.Response = vi.fn() as unknown as typeof Response;

// Use real timers by default for integration tests
// Individual tests can use vi.useFakeTimers() if needed
vi.useRealTimers();

// Mock ResizeObserver which is not available in test environment
class ResizeObserverMock implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock IntersectionObserver which is not available in test environment
class IntersectionObserverMock implements IntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  callback: IntersectionObserverCallback;
  root: Element | Document | null = null;
  rootMargin = '0px';
  thresholds: ReadonlyArray<number> = [0];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Silence React 18 console warnings about act()
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filter out specific React warnings that clutter test output
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: An update to') ||
      args[0].includes('was not wrapped in act') ||
      args[0].includes('Warning: React does not recognize the') ||
      args[0].includes('The current testing environment is not configured to support act'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Silence console.log during tests to keep output clean
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  // Only show logs in verbose mode or if they contain specific keywords
  if (process.env.VITEST_VERBOSE === 'true' || args.some((arg) => typeof arg === 'string' && arg.includes('[ERROR]'))) {
    originalConsoleLog(...args);
  }
};

// Clean up after all tests
afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});
