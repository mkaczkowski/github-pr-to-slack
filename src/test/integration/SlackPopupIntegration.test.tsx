import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SlackPopup } from '../../pages/content/components/SlackPopup/SlackPopup';
import { act } from 'react-dom/test-utils';
import { setupChromeMocks } from '../mocks/chromeSetup';
import { setupClipboardMock, createPortalRoot, TEST_CONSTANTS, setupTestEnvironment } from '../utils/testUtils';
import { mockGetStoredChannel } from '../mocks/storageMocks';

// Standard timeout for async operations
const STANDARD_TIMEOUT = 2000;

// Create mock implementations for hooks
const mockGeneratePreviewMessage = vi.fn(() => TEST_CONSTANTS.TEST_MESSAGE);
const mockSendToSlack = vi.fn().mockResolvedValue({ success: true });
const mockCheckSlackConfig = vi.fn().mockResolvedValue(true);
const mockSetStatusMessage = vi.fn();

// Mock the hooks
vi.mock('../../pages/content/hooks/useGithubPR', () => ({
  useGithubPR: vi.fn(() => ({
    prInfo: {
      title: TEST_CONSTANTS.PR_TITLE,
      url: TEST_CONSTANTS.PR_URL,
      reviewers: TEST_CONSTANTS.PR_REVIEWERS,
      loc: TEST_CONSTANTS.PR_LOC,
    },
    generatePreviewMessage: mockGeneratePreviewMessage,
  })),
}));

// Mock the useSlack hook
vi.mock('../../pages/content/hooks/useSlack', () => ({
  useSlack: vi.fn(() => ({
    isConfigured: true,
    statusMessage: { text: '', type: '' },
    setStatusMessage: mockSetStatusMessage,
    checkSlackConfig: mockCheckSlackConfig,
    loadStoredChannel: mockGetStoredChannel,
    sendToSlack: mockSendToSlack,
  })),
}));

// Import the mocked hooks
import { useSlack } from '../../pages/content/hooks/useSlack';

describe('SlackPopup Integration', () => {
  // Store portal root for cleanup
  let portalRoot: { cleanup: () => void };
  // Store test environment cleanup
  let cleanup: () => void;

  beforeEach(() => {
    // Setup common test environment
    cleanup = setupTestEnvironment();

    // Setup Chrome mocks
    setupChromeMocks();

    // Setup clipboard mock
    setupClipboardMock();

    // Create portal root for the popup
    portalRoot = createPortalRoot();

    // Reset mock functions
    vi.clearAllMocks();

    // Reset mock implementations
    mockGetStoredChannel.mockResolvedValue(TEST_CONSTANTS.DEFAULT_CHANNEL);
  });

  afterEach(() => {
    // Clean up portal root
    portalRoot.cleanup();
    // Clean up test environment
    cleanup();
  });

  it('should correctly render the Slack popup with PR data and channel input', async () => {
    // Render the popup
    render(<SlackPopup onClose={vi.fn()} />);

    // Verify PR info is displayed in the header
    expect(screen.getByText('Send PR to Slack')).toBeInTheDocument();

    // Verify channel input is labeled correctly for user input
    const channelLabel = screen.getByLabelText(/Channel or User/i);
    expect(channelLabel).toBeInTheDocument();

    // Verify message textarea exists for editing the message
    const messageTextarea = screen.getByLabelText(/Message/i);
    expect(messageTextarea).toBeInTheDocument();

    // Verify action buttons are present and correctly labeled
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('should send message to Slack with the specified channel and message content when form is submitted', async () => {
    // Create a custom implementation for this test with success response
    const customSendToSlack = vi.fn().mockResolvedValue({ success: true });

    // Override the useSlack hook for this test only with custom implementation
    vi.mocked(useSlack).mockReturnValue({
      isConfigured: true,
      statusMessage: { text: '', type: '' },
      setStatusMessage: mockSetStatusMessage,
      checkSlackConfig: mockCheckSlackConfig,
      loadStoredChannel: vi.fn().mockResolvedValue(''), // Start with empty channel
      sendToSlack: customSendToSlack,
    });

    // Render the popup
    render(<SlackPopup onClose={vi.fn()} />);

    // Fill in the form with test data
    await act(async () => {
      // Set the channel to a specific test channel
      const channelInput = screen.getByLabelText(/Channel or User/i);
      fireEvent.change(channelInput, {
        target: { value: '#testing' },
      });

      // Set the message content using the test constant
      const messageTextarea = screen.getByLabelText(/Message/i);
      fireEvent.change(messageTextarea, {
        target: { value: TEST_CONSTANTS.TEST_MESSAGE },
      });
    });

    // Submit the form by clicking the Send button
    await act(async () => {
      fireEvent.click(screen.getByText('Send'));
    });

    // Verify the message was sent with the exact channel and message content we set
    expect(customSendToSlack).toHaveBeenCalledWith({ channel: '#testing', message: TEST_CONSTANTS.TEST_MESSAGE });

    // Wait for any async operations to complete
    await waitFor(
      () => {
        expect(customSendToSlack).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('should display error message and options button when Slack is not configured', async () => {
    // Override the useSlack hook for this test to return not configured state
    vi.mocked(useSlack).mockReturnValue({
      isConfigured: false,
      statusMessage: {
        text: 'Slack is not configured. Please configure it in the options page.',
        type: 'error',
      },
      setStatusMessage: mockSetStatusMessage,
      checkSlackConfig: vi.fn().mockResolvedValue(false),
      loadStoredChannel: vi.fn().mockResolvedValue(''),
      sendToSlack: vi.fn(),
    });

    // Render the popup
    render(<SlackPopup onClose={vi.fn()} />);

    // Verify error message is displayed with the correct text
    expect(screen.getByText(/Slack is not configured/i)).toBeInTheDocument();

    // Verify the "Open Options" button is displayed for user to configure Slack
    expect(screen.getByText('Open Options')).toBeInTheDocument();

    // Wait for any async operations to complete
    await waitFor(
      () => {
        expect(screen.getByText(/Slack is not configured/i)).toBeInTheDocument();
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('should copy message to clipboard when Copy button is clicked', async () => {
    // Clear previous mock calls to clipboard API
    vi.mocked(navigator.clipboard.writeText).mockClear();

    // Render the popup
    render(<SlackPopup onClose={vi.fn()} />);

    // Get the message textarea for setting content
    const messageTextarea = screen.getByLabelText(/Message/i);

    // Set a value in the textarea with test message
    await act(async () => {
      fireEvent.change(messageTextarea, {
        target: { value: TEST_CONSTANTS.TEST_MESSAGE },
      });
    });

    // Click the Copy button to trigger clipboard copy
    await act(async () => {
      fireEvent.click(screen.getByText('Copy to Clipboard'));
    });

    // Verify clipboard API was called with the exact message content
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TEST_CONSTANTS.TEST_MESSAGE);

    // Wait for any async operations to complete
    await waitFor(
      () => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('should close the popup when clicking outside the popup content area', async () => {
    // Create a mock close function to verify it's called
    const mockClose = vi.fn();

    // Render the popup with the mock close function
    render(<SlackPopup onClose={mockClose} />);

    // Find the overlay element (the background behind the popup)
    const overlay = document.querySelector('._overlay_83ec5f');
    expect(overlay).not.toBeNull();

    // Simulate a mousedown event on the overlay (not on the popup itself)
    if (overlay) {
      // We need to use mouseDown because that's typically what triggers the close
      await act(async () => {
        // Create a mousedown event that has the correct target
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });

        // Dispatch the event on the overlay
        overlay.dispatchEvent(mouseDownEvent);
      });
    }

    // Verify onClose was called when clicking outside
    expect(mockClose).toHaveBeenCalled();

    // Wait for any async operations to complete
    await waitFor(
      () => {
        expect(mockClose).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });
});
