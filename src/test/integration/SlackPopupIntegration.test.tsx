import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SlackPopup } from '../../pages/content/components/SlackPopup/SlackPopup';
import { act } from 'react-dom/test-utils';
import { setupChromeMocks } from '../mocks/chromeSetup';
import { setupClipboardMock, createPortalRoot, TEST_CONSTANTS, setupTestEnvironment } from '../utils/testUtils';
import { mockGetLastUsedWebhookName, mockGetSlackWebhooks } from '../mocks/storageMocks';

const STANDARD_TIMEOUT = 2000;

const mockGeneratePreviewMessage = vi.fn(() => TEST_CONSTANTS.TEST_MESSAGE);
const mockSendToSlack = vi.fn().mockResolvedValue({ success: true });
const mockCheckSlackConfig = vi.fn().mockResolvedValue(true);
const mockSetStatusMessage = vi.fn();

const defaultWebhooks = [{ name: TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME, url: TEST_CONSTANTS.SLACK_WEBHOOK_URL }];

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

vi.mock('../../pages/content/hooks/useSlack', () => ({
  useSlack: vi.fn(() => ({
    isConfigured: true,
    statusMessage: { text: '', type: '' },
    setStatusMessage: mockSetStatusMessage,
    checkSlackConfig: mockCheckSlackConfig,
    loadWebhooks: mockGetSlackWebhooks,
    loadLastUsedWebhookName: mockGetLastUsedWebhookName,
    sendToSlack: mockSendToSlack,
  })),
}));

import { useSlack } from '../../pages/content/hooks/useSlack';

describe('SlackPopup Integration', () => {
  let portalRoot: { cleanup: () => void };
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupTestEnvironment();

    setupChromeMocks();
    setupClipboardMock();

    portalRoot = createPortalRoot();

    vi.clearAllMocks();

    mockGetSlackWebhooks.mockResolvedValue(defaultWebhooks);
    mockGetLastUsedWebhookName.mockResolvedValue(TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME);
  });

  afterEach(() => {
    portalRoot.cleanup();
    cleanup();
  });

  it('renders the Slack popup with a webhook select and message textarea', async () => {
    render(<SlackPopup onClose={vi.fn()} />);

    expect(screen.getByText('Send PR to Slack')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Webhook$/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('sends the selected webhook and message content when the form is submitted', async () => {
    const customSendToSlack = vi.fn().mockResolvedValue({ success: true });
    const webhooks = [
      { name: TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME, url: TEST_CONSTANTS.SLACK_WEBHOOK_URL },
      { name: 'backend', url: TEST_CONSTANTS.UPDATED_SLACK_WEBHOOK_URL },
    ];

    vi.mocked(useSlack).mockReturnValue({
      isConfigured: true,
      statusMessage: { text: '', type: '' },
      setStatusMessage: mockSetStatusMessage,
      checkSlackConfig: mockCheckSlackConfig,
      loadWebhooks: vi.fn().mockResolvedValue(webhooks),
      loadLastUsedWebhookName: vi.fn().mockResolvedValue(''),
      sendToSlack: customSendToSlack,
    });

    render(<SlackPopup onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'backend' })).toBeInTheDocument();
    });

    await act(async () => {
      const select = screen.getByLabelText(/^Webhook$/i) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'backend' } });

      const messageTextarea = screen.getByLabelText(/Message/i);
      fireEvent.change(messageTextarea, { target: { value: TEST_CONSTANTS.TEST_MESSAGE } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Send'));
    });

    expect(customSendToSlack).toHaveBeenCalledWith({
      webhookName: 'backend',
      message: TEST_CONSTANTS.TEST_MESSAGE,
    });

    await waitFor(() => expect(customSendToSlack).toHaveBeenCalled(), { timeout: STANDARD_TIMEOUT });
  });

  it('shows the options CTA when no webhooks are configured', async () => {
    vi.mocked(useSlack).mockReturnValue({
      isConfigured: false,
      statusMessage: {
        text: 'Slack is not configured. Please configure it in the options page.',
        type: 'warning',
      },
      setStatusMessage: mockSetStatusMessage,
      checkSlackConfig: vi.fn().mockResolvedValue(false),
      loadWebhooks: vi.fn().mockResolvedValue([]),
      loadLastUsedWebhookName: vi.fn().mockResolvedValue(''),
      sendToSlack: vi.fn(),
    });

    render(<SlackPopup onClose={vi.fn()} />);

    expect(screen.getByText(/Slack is not configured/i)).toBeInTheDocument();
    expect(screen.getByText('Open Options')).toBeInTheDocument();
  });

  it('copies the message to clipboard when the Copy button is clicked', async () => {
    vi.mocked(navigator.clipboard.writeText).mockClear();

    render(<SlackPopup onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByLabelText(/Message/i)).toBeInTheDocument());

    const messageTextarea = screen.getByLabelText(/Message/i);

    await act(async () => {
      fireEvent.change(messageTextarea, { target: { value: TEST_CONSTANTS.TEST_MESSAGE } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Copy to Clipboard'));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TEST_CONSTANTS.TEST_MESSAGE);

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled(), { timeout: STANDARD_TIMEOUT });
  });

  it('closes the popup when clicking outside the popup content area', async () => {
    const mockClose = vi.fn();

    render(<SlackPopup onClose={mockClose} />);

    const overlay = document.querySelector('._overlay_83ec5f');
    expect(overlay).not.toBeNull();

    if (overlay) {
      await act(async () => {
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        overlay.dispatchEvent(mouseDownEvent);
      });
    }

    expect(mockClose).toHaveBeenCalled();
  });
});
