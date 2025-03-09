import { vi, beforeEach, afterEach } from 'vitest';

/**
 * Standard beforeEach hook for tests
 * - Resets all mocks
 * - Sets up common mocks
 *
 * @param setupFn Optional function to run additional setup
 */
export function setupTest(setupFn?: () => void) {
  beforeEach(() => {
    // Reset all mocks to clean state
    vi.resetAllMocks();

    // Run additional setup if provided
    if (setupFn) {
      setupFn();
    }
  });
}

/**
 * Standard afterEach hook for tests
 * - Restores all mocks
 *
 * @param cleanupFn Optional function to run additional cleanup
 */
export function cleanupTest(cleanupFn?: () => void) {
  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();

    // Run additional cleanup if provided
    if (cleanupFn) {
      cleanupFn();
    }
  });
}

/**
 * Sets up a complete test environment with beforeEach and afterEach hooks
 *
 * @param setupFn Optional function to run additional setup
 * @param cleanupFn Optional function to run additional cleanup
 */
export function setupTestEnvironment(setupFn?: () => void, cleanupFn?: () => void) {
  setupTest(setupFn);
  cleanupTest(cleanupFn);
}
