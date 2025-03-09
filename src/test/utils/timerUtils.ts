import { vi } from 'vitest';

/**
 * Setup fake timers for a test
 * @returns A cleanup function to restore real timers
 */
export function setupFakeTimers() {
  vi.useFakeTimers();
  return () => {
    vi.useRealTimers();
  };
}

/**
 * Advance timers by a specified amount and flush promises
 * @param ms Milliseconds to advance
 */
export async function advanceTimersByTime(ms: number) {
  vi.advanceTimersByTime(ms);
  // Allow any pending promises to resolve
  await vi.runAllTimersAsync();
}

/**
 * Run all timers and flush promises
 */
export async function runAllTimers() {
  await vi.runAllTimersAsync();
}

/**
 * Wait for a specified amount of time in real time
 * This is useful when you need to wait for real async operations
 * @param ms Milliseconds to wait
 */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a callback with fake timers and restore real timers afterward
 * @param callback The function to run with fake timers
 */
export async function withFakeTimers<T>(callback: () => Promise<T> | T): Promise<T> {
  vi.useFakeTimers();
  try {
    const result = await callback();
    return result;
  } finally {
    vi.useRealTimers();
  }
}
