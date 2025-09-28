import { vi } from 'vitest';
import { chromeMock } from '../mocks/chrome';

/**
 * Test constants for consistent test data
 */
export const TEST_CONSTANTS = {
  GITHUB_HOST: 'github.company.com',
  SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
  UPDATED_SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T00000000/B11111111/YYYYYYYYYYYYYYYYYYYYYYYY',
  DEFAULT_CHANNEL: '#general',
  PR_TITLE: 'Test PR Title',
  PR_URL: 'https://github.com/user/repo/pull/123',
  PR_REVIEWERS: ['user1', 'user2'],
  PR_LOC: ['+100', '-50'],
  TEST_MESSAGE: '*Test PR Title* (+100, -50)\nhttps://github.com/user/repo/pull/123\nassigned: <@user1>, <@user2>',
};

/**
 * Setup common test environment for all tests
 */
export function setupTestEnvironment() {
  // Reset all mocks
  vi.clearAllMocks();

  // Return cleanup function
  return () => {
    vi.resetAllMocks();
  };
}

/**
 * Setup mock for window.matchMedia
 */
export function setupMatchMediaMock() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Setup mock for navigator.clipboard
 */
export function setupClipboardMock() {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    writable: true,
  });
}

/**
 * Create a debounced function for testing
 * @param callback The function to debounce
 * @param delayMs The debounce delay in milliseconds
 * @param source Source identifier for logging
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number,
  source: string,
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
      console.log(`Executed debounced function from ${source}`);
    }, delayMs);
  };
}

/**
 * Type-safe mock for MutationObserver
 */
export interface MockMutationObserver {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  trigger: (mutations: MutationRecord[]) => void;
}

/**
 * Setup a mock MutationObserver
 */
export function setupMutationObserverMock() {
  let mockObserverInstance: MockMutationObserver;

  const originalMutationObserver = window.MutationObserver;

  const mockMutationObserver = function (this: MockMutationObserver, callback: MutationCallback) {
    this.observe = vi.fn();
    this.disconnect = vi.fn();
    this.trigger = (mutations: MutationRecord[]) => {
      callback(mutations, this as unknown as MutationObserver);
    };
    mockObserverInstance = this;
    return this;
  } as unknown as typeof MutationObserver;

  window.MutationObserver = mockMutationObserver;

  return {
    mockObserverInstance: () => mockObserverInstance,
    cleanup: () => {
      window.MutationObserver = originalMutationObserver;
    },
  };
}

/**
 * Setup history API mocks for SPA navigation testing
 */
export function setupHistoryMocks() {
  const originalHistory = window.history;
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  return {
    mockPushState: (callback: () => void) => {
      window.history.pushState = function (...args) {
        originalPushState.apply(this, args);
        callback();
      };
    },
    mockReplaceState: (callback: () => void) => {
      window.history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        callback();
      };
    },
    cleanup: () => {
      window.history = originalHistory;
    },
  };
}

/**
 * Setup timer mocks for testing debounced functions
 */
export function setupTimerMocks() {
  const originalSetTimeout = window.setTimeout;
  const originalClearTimeout = window.clearTimeout;

  let timeoutCallback: Function | null = null;

  // Use type assertion to avoid TypeScript errors with setTimeout
  const mockedSetTimeout = vi.fn((callback, delay) => {
    timeoutCallback = callback as Function;
    return 123 as unknown as NodeJS.Timeout;
  });

  // Use type assertion to assign the mocked function
  window.setTimeout = mockedSetTimeout as unknown as typeof window.setTimeout;
  window.clearTimeout = vi.fn() as unknown as typeof window.clearTimeout;

  return {
    triggerLastTimeout: () => {
      if (timeoutCallback) {
        timeoutCallback();
      }
    },
    cleanup: () => {
      window.setTimeout = originalSetTimeout;
      window.clearTimeout = originalClearTimeout;
    },
  };
}

/**
 * Setup location mock for URL testing
 */
export function setupLocationMock(url: string) {
  // Store the original location object
  const originalLocation = window.location;

  // Create a new location object with the desired URL
  const newLocation = {
    ...originalLocation,
    href: url,
  };

  // Use defineProperty to set the location
  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    value: newLocation,
    writable: true,
  });

  return {
    cleanup: () => {
      // Restore the original location
      Object.defineProperty(window, 'location', {
        configurable: true,
        enumerable: true,
        value: originalLocation,
        writable: true,
      });
    },
  };
}

/**
 * Create a portal root element for React portals
 */
export function createPortalRoot(id = 'slack-popup-root') {
  const portalRoot = document.createElement('div');
  portalRoot.setAttribute('id', id);
  document.body.appendChild(portalRoot);

  return {
    cleanup: () => {
      document.body.removeChild(portalRoot);
    },
  };
}
