import { vi } from 'vitest';
import { chromeMock, mockChromeStorageSync } from './chrome';
import { TEST_CONSTANTS } from '../utils/testUtils';

/**
 * Setup Chrome API mocks with default values or custom options
 * @param options Configuration options for Chrome mocks
 * @returns Object containing the configured chromeMock
 */
export function setupChromeMocks(
  options: {
    storageData?: Record<string, any>;
    runtimeSendMessageResponse?: any;
  } = {},
) {
  const {
    storageData = {
      githubHost: TEST_CONSTANTS.GITHUB_HOST,
      slackWebhookUrl: TEST_CONSTANTS.SLACK_WEBHOOK_URL,
      themePreference: 'system',
    },
    runtimeSendMessageResponse = { success: true },
  } = options;

  // Reset all mocks to ensure clean state
  vi.clearAllMocks();

  // Setup storage mock with provided or default data
  mockChromeStorageSync(storageData);

  // Setup runtime.sendMessage mock with configurable response
  chromeMock.runtime.sendMessage = vi.fn().mockImplementation((_message, _options, callback) => {
    if (callback) {
      callback(runtimeSendMessageResponse);
    }
    return Promise.resolve(runtimeSendMessageResponse);
  });

  // Setup Chrome storage sync.set with callback support
  chromeMock.storage.sync.set = vi.fn((data, callback) => {
    if (callback) callback();
    return Promise.resolve();
  });

  // Setup message listener mock with type-safe listener property
  chromeMock.runtime.onMessage = {
    addListener: vi.fn((listener) => {
      // Store the listener function for later use in tests
      (chromeMock.runtime.onMessage as any).listener = listener;
    }),
    removeListener: vi.fn(),
  };

  return {
    chromeMock,
  };
}

/**
 * Setup a mock message handler for background-content communication
 * @returns Object containing the configured message handler
 */
export function setupMessageHandler() {
  // Create a type-safe mock message handler
  const mockMessageHandler = vi.fn(async (message: any, sender: any, sendResponse: any) => {
    if (message.message === 'checkSlackConfig') {
      // Mock checking Slack config
      const callback = (result: { slackWebhookUrl?: string }) => {
        sendResponse({
          configured: !!result.slackWebhookUrl,
        });
      };
      chromeMock.storage.sync.get('slackWebhookUrl', callback);
      return true;
    } else if (message.message === 'sendToSlack') {
      // Mock sending to Slack
      const callback = async (result: { slackWebhookUrl?: string }) => {
        // Handle case when webhook URL is not configured
        if (!result.slackWebhookUrl) {
          sendResponse({
            success: false,
            error: 'Slack webhook URL is not configured',
          });
          return;
        }

        try {
          // Mock successful response by default
          // In tests, this can be overridden with setupFetchMock
          sendResponse({
            success: true,
          });
        } catch (error: unknown) {
          // Type-safe error handling
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          sendResponse({
            success: false,
            error: `Network error: ${errorMessage}`,
          });
        }
      };
      chromeMock.storage.sync.get('slackWebhookUrl', callback);
      return true;
    } else if (message.message === 'openOptionsPage') {
      // Mock opening options page
      chromeMock.runtime.openOptionsPage();
      sendResponse({
        success: true,
      });
      return true;
    } else {
      // Handle unknown message types with descriptive error
      sendResponse({
        success: false,
        error: `Unknown message type: ${message.message}`,
      });
      return true;
    }
  });

  // Add the mock message handler to the runtime.onMessage listeners
  chromeMock.runtime.onMessage.addListener(mockMessageHandler);

  return {
    mockMessageHandler,
  };
}

/**
 * Setup a mock fetch for Slack API calls with configurable responses
 * @param options Configuration options for fetch mock
 * @returns Object containing the configured fetch mock
 */
export function setupFetchMock(
  options: {
    success?: boolean;
    status?: number;
    responseText?: string;
  } = {},
) {
  const { success = true, status = 200, responseText = 'ok' } = options;

  // Create a type-safe mock for fetch with configurable response
  const mockFetch = vi.fn().mockResolvedValue({
    ok: success,
    status,
    text: () => Promise.resolve(responseText),
  });

  // Replace global fetch with our mock
  global.fetch = mockFetch;

  return {
    mockFetch,
  };
}
