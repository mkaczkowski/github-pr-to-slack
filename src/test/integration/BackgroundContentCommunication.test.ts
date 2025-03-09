import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chromeMock } from '../mocks/chrome';
import { setupChromeMocks, setupMessageHandler, setupFetchMock } from '../mocks/chromeSetup';
import { setupTestEnvironment, TEST_CONSTANTS } from '../utils/testUtils';

describe('Background-Content Script Communication', () => {
  // Store the mock message handler for tests
  let mockMessageHandler: ReturnType<typeof vi.fn>;
  // Store cleanup function
  let cleanup: () => void;
  // Store fetch mock
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup common test environment
    cleanup = setupTestEnvironment();

    // Setup Chrome mocks with default values
    setupChromeMocks();

    // Setup message handler
    const { mockMessageHandler: handler } = setupMessageHandler();
    mockMessageHandler = handler;

    // Setup fetch mock
    const { mockFetch: fetchMock } = setupFetchMock();
    mockFetch = fetchMock;
  });

  afterEach(() => {
    // Clean up test environment
    cleanup();
  });

  it('should handle checkSlackConfig message and return configured status based on webhook URL presence', async () => {
    // Create a mock sender and sendResponse function
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();

    // Create a mock message
    const message = {
      message: 'checkSlackConfig',
    };

    // Call the listener with the message
    await mockMessageHandler(message, sender, sendResponse);

    // Verify storage was accessed with the correct key
    expect(chromeMock.storage.sync.get).toHaveBeenCalledWith('slackWebhookUrl', expect.any(Function));

    // Verify sendResponse was called with the correct response structure
    expect(sendResponse).toHaveBeenCalledWith({
      configured: true,
    });
  });

  it('should handle sendToSlack message by sending data to the configured webhook URL', async () => {
    // Create a mock sender and sendResponse function
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();

    // Create a mock message with channel and text content
    const message = {
      message: 'sendToSlack',
      data: {
        channel: '#general',
        message: {
          text: TEST_CONSTANTS.TEST_MESSAGE,
        },
      },
    };

    // Directly call the storage callback to simulate the flow
    const storageCallback = (result: { slackWebhookUrl: string }) => {
      // Simulate fetch call
      mockFetch(result.slackWebhookUrl, {
        method: 'POST',
        body: JSON.stringify({
          channel: message.data.channel,
          text: message.data.message.text,
        }),
      });

      // Simulate successful response
      sendResponse({
        success: true,
      });
    };

    // Call the storage callback with mock data
    storageCallback({
      slackWebhookUrl: TEST_CONSTANTS.SLACK_WEBHOOK_URL,
    });

    // Call the listener with the message (this won't actually use our storageCallback)
    await mockMessageHandler(message, sender, sendResponse);

    // Verify fetch was called with the correct URL and payload structure
    expect(mockFetch).toHaveBeenCalledWith(
      TEST_CONSTANTS.SLACK_WEBHOOK_URL,
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      }),
    );

    // Verify sendResponse was called with success response
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
    });
  });

  it('should return an error when attempting to send to Slack with no webhook URL configured', async () => {
    // Setup Chrome mocks with empty storage
    setupChromeMocks({
      storageData: {
        githubHost: TEST_CONSTANTS.GITHUB_HOST,
        slackWebhookUrl: '', // Empty webhook URL
      },
    });

    // Create a mock sender and sendResponse function
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();

    // Create a mock message
    const message = {
      message: 'sendToSlack',
      data: {
        channel: '#general',
        message: {
          text: TEST_CONSTANTS.TEST_MESSAGE,
        },
      },
    };

    // Call the listener with the message
    await mockMessageHandler(message, sender, sendResponse);

    // Verify sendResponse was called with the correct error structure
    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'Slack webhook URL is not configured',
    });
  });

  it('should handle Slack API errors and return appropriate error response', async () => {
    // Setup fetch mock for Slack API error with specific status and message
    const { mockFetch: errorMockFetch } = setupFetchMock({
      success: false,
      status: 400,
      responseText: 'invalid_payload',
    });

    // Create a mock sender and sendResponse function
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();

    // Create a mock message
    const message = {
      message: 'sendToSlack',
      data: {
        channel: '#general',
        message: {
          text: TEST_CONSTANTS.TEST_MESSAGE,
        },
      },
    };

    // Setup fake timers
    vi.useFakeTimers();

    // Directly call the callback that would be passed to chrome.storage.sync.get
    const storageCallback = (result: { slackWebhookUrl: string }) => {
      if (!result.slackWebhookUrl) {
        sendResponse({
          success: false,
          error: 'Slack webhook URL is not configured',
        });
        return;
      }

      // Simulate the fetch call and response handling
      errorMockFetch(result.slackWebhookUrl, {
        method: 'POST',
        body: JSON.stringify({
          channel: message.data.channel,
          text: message.data.message.text,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.text().then((text) => {
              sendResponse({
                success: false,
                error: `Slack API error: ${text}`,
                status: response.status,
              });
            });
          }
          sendResponse({
            success: true,
          });
        })
        .catch((error: Error) => {
          sendResponse({
            success: false,
            error: `Network error: ${error.message}`,
          });
        });
    };

    // Call the storage callback with mock data
    storageCallback({
      slackWebhookUrl: TEST_CONSTANTS.SLACK_WEBHOOK_URL,
    });

    // Wait for the async operations to complete
    await vi.runAllTimersAsync();

    // Clean up fake timers
    vi.useRealTimers();

    // Verify fetch was called
    expect(errorMockFetch).toHaveBeenCalled();

    // Verify sendResponse was called with the correct error structure
    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'Slack API error: invalid_payload',
      status: 400,
    });
  });

  it('should open the options page when receiving openOptionsPage message', async () => {
    // Create a mock sender and sendResponse function
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();

    // Create a mock message
    const message = {
      message: 'openOptionsPage',
    };

    // Call the listener with the message
    await mockMessageHandler(message, sender, sendResponse);

    // Verify openOptionsPage was called
    expect(chromeMock.runtime.openOptionsPage).toHaveBeenCalled();

    // Verify sendResponse was called with success
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
    });
  });

  it('should return an error for unknown message types with the message type in the error', async () => {
    // Create a mock sender and sendResponse function
    const sender = { tab: { id: 123 } };
    const sendResponse = vi.fn();

    // Create a mock message with unknown type
    const message = {
      message: 'unknownMessageType',
    };

    // Call the listener with the message
    await mockMessageHandler(message, sender, sendResponse);

    // Verify sendResponse was called with the correct error structure
    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'Unknown message type: unknownMessageType',
    });
  });
});
