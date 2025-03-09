import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupChromeMocks } from '../mocks/chromeSetup';
import {
  setupMutationObserverMock,
  setupHistoryMocks,
  setupTimerMocks,
  setupLocationMock,
  createDebouncedFunction,
  MockMutationObserver,
  setupTestEnvironment,
} from '../utils/testUtils';

// Mock the isSupportedUrl function directly
const isSupportedUrl = vi.fn((url) => {
  // Mock implementation that returns true for GitHub PR URLs
  return url && url.includes('github') && url.includes('pull');
});

describe('SPA Navigation Handling', () => {
  // Mock functions for the content script
  const checkAndReinitialize = vi.fn();
  const init = vi.fn();

  // Store mock objects for cleanup
  let mutationObserverMock: { cleanup: () => void; mockObserverInstance: () => MockMutationObserver };
  let historyMock: {
    cleanup: () => void;
    mockPushState: (callback: () => void) => void;
    mockReplaceState: (callback: () => void) => void;
  };
  let timerMock: { cleanup: () => void; triggerLastTimeout: () => void };
  let locationMock: { cleanup: () => void } | null = null;
  let cleanup: () => void;

  beforeEach(() => {
    // Setup common test environment
    cleanup = setupTestEnvironment();

    // Setup Chrome mocks
    setupChromeMocks();

    // Setup MutationObserver mock
    mutationObserverMock = setupMutationObserverMock();

    // Setup History API mocks
    historyMock = setupHistoryMocks();

    // Setup timer mocks
    timerMock = setupTimerMocks();

    // Reset mock functions
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up all mocks
    mutationObserverMock.cleanup();
    historyMock.cleanup();
    timerMock.cleanup();

    if (locationMock) {
      locationMock.cleanup();
      locationMock = null;
    }

    // Clean up test environment
    cleanup();
  });

  it('should intercept history.pushState and trigger reinitialization when navigation occurs', () => {
    // Setup history listeners
    historyMock.mockPushState(checkAndReinitialize);

    // Simulate navigation
    window.history.pushState({}, '', '/new-page');

    // Verify checkAndReinitialize was called
    expect(checkAndReinitialize).toHaveBeenCalled();
  });

  it('should use MutationObserver to detect DOM changes and trigger reinitialization', () => {
    // Setup mutation observer
    const observer = new MutationObserver(() => {
      checkAndReinitialize();
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
    });

    // Verify observer was setup correctly with the right configuration
    expect(observer.observe).toHaveBeenCalledWith(document, {
      childList: true,
      subtree: true,
    });

    // Simulate DOM mutation with a new div element
    const mockObserver = mutationObserverMock.mockObserverInstance();
    mockObserver.trigger([
      {
        type: 'childList',
        addedNodes: [document.createElement('div')],
        removedNodes: [],
        target: document.body,
      } as unknown as MutationRecord,
    ]);

    // Verify checkAndReinitialize was called in response to the mutation
    expect(checkAndReinitialize).toHaveBeenCalled();
  });

  it('should properly debounce multiple rapid changes to prevent excessive reinitializations', () => {
    // Create debounced function
    const debouncedCheck = createDebouncedFunction(checkAndReinitialize, 100, 'test');

    // Call multiple times in rapid succession to simulate rapid changes
    debouncedCheck();
    debouncedCheck();
    debouncedCheck();

    // Verify setTimeout was called the correct number of times
    expect(window.setTimeout).toHaveBeenCalledTimes(3);

    // Verify clearTimeout was called to cancel previous timers
    expect(window.clearTimeout).toHaveBeenCalledTimes(2);

    // checkAndReinitialize should not have been called yet before timeout completes
    expect(checkAndReinitialize).not.toHaveBeenCalled();

    // Now manually trigger the last setTimeout callback to simulate timeout completion
    timerMock.triggerLastTimeout();

    // Now checkAndReinitialize should have been called exactly once
    expect(checkAndReinitialize).toHaveBeenCalledTimes(1);
  });

  it('should only reinitialize on supported GitHub PR URLs and skip other URLs', async () => {
    // Test with unsupported URL
    locationMock = setupLocationMock('https://example.com/not-a-pr');

    // Setup function that checks URL before reinitializing
    const checkAndReinitializeWithUrlCheck = async () => {
      const currentUrl = window.location.href;

      if (isSupportedUrl(currentUrl)) {
        await init();
        console.log(`Reinitialized on supported URL: ${currentUrl}`);
      } else {
        console.log(`Skipped reinitialization on unsupported URL: ${currentUrl}`);
      }
    };

    await checkAndReinitializeWithUrlCheck();

    // Verify init was not called for unsupported URL
    expect(init).not.toHaveBeenCalled();
    expect(isSupportedUrl).toHaveBeenCalledWith('https://example.com/not-a-pr');

    // Clean up the previous location mock
    locationMock.cleanup();

    // Test with supported GitHub PR URL
    locationMock = setupLocationMock('https://github.com/user/repo/pull/123');

    await checkAndReinitializeWithUrlCheck();

    // Verify init was called for supported URL
    expect(init).toHaveBeenCalledTimes(1);
    expect(isSupportedUrl).toHaveBeenCalledWith('https://github.com/user/repo/pull/123');
  });
});
