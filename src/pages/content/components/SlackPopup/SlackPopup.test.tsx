import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SlackPopup } from './SlackPopup';
import SlackPopupFooter from '../SlackPopupFooter/SlackPopupFooter';
import { setupTestEnvironment } from '../../../../test/testSetup';

const defaultWebhooks = [
  { name: 'Default', url: 'https://hooks.slack.com/services/A/B/C' },
  { name: 'backend', url: 'https://hooks.slack.com/services/D/E/F' },
];

const mockSetStatusMessage = vi.fn();
const mockCheckSlackConfig = vi.fn().mockResolvedValue(true);
const mockLoadWebhooks = vi.fn().mockResolvedValue(defaultWebhooks);
const mockLoadLastUsedWebhookName = vi.fn().mockResolvedValue('Default');
const mockSendToSlack = vi.fn().mockResolvedValue({ success: true });
const mockCopyToClipboard = vi.fn().mockResolvedValue(true);
const mockOpenOptions = vi.fn();
const mockHandleKeyDown = vi.fn();
const mockGeneratePreviewMessage = vi.fn().mockReturnValue('Test PR message');

const methods = {
  handleSubmit: vi.fn((fn) => fn),
  setValue: vi.fn(),
  trigger: vi.fn(),
  getValues: vi.fn((key) => {
    if (key === 'message') return 'Test message';
    if (key === 'webhookName') return 'Default';
    return { message: 'Test message', webhookName: 'Default' };
  }),
  formState: { isSubmitting: false, errors: {} },
  control: {},
};

vi.mock('../../hooks/useGithubPR', () => ({
  useGithubPR: () => ({
    prInfo: {
      title: 'Test PR Title',
      url: 'https://github.com/owner/repo/pull/123',
      reviewers: ['user1', 'user2'],
      loc: ['+100', '-50'],
    },
    generatePreviewMessage: mockGeneratePreviewMessage,
  }),
}));

vi.mock('../../hooks/useSlack', () => ({
  useSlack: () => ({
    isConfigured: true,
    statusMessage: { text: '', type: '' },
    setStatusMessage: mockSetStatusMessage,
    checkSlackConfig: mockCheckSlackConfig,
    loadWebhooks: mockLoadWebhooks,
    loadLastUsedWebhookName: mockLoadLastUsedWebhookName,
    sendToSlack: mockSendToSlack,
  }),
}));

vi.mock('../../hooks/useUIHelpers', () => ({
  useUIHelpers: () => ({
    popupRef: { current: document.createElement('div') },
    copyToClipboard: mockCopyToClipboard,
    openOptions: mockOpenOptions,
    handleKeyDown: mockHandleKeyDown,
  }),
}));

vi.mock('react-hook-form', () => ({
  useForm: () => methods,
  FormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFormContext: () => ({
    register: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(() => ({ message: 'Test message', webhookName: 'Default' })),
    formState: { errors: {} },
    getValues: methods.getValues,
  }),
}));

vi.mock('../SlackPopupContent/SlackPopupContent', () => {
  const MockSlackPopupContent = () => <div data-testid="mock-content">Mock Content</div>;
  return {
    __esModule: true,
    default: MockSlackPopupContent,
  };
});

vi.mock('../SlackPopupFooter/SlackPopupFooter', () => {
  const MockSlackPopupFooter = vi.fn(({ handleCopyToClipboard }) => {
    (MockSlackPopupFooter as any).lastHandler = handleCopyToClipboard;
    return <div data-testid="mock-footer">Mock Footer</div>;
  });
  return {
    __esModule: true,
    default: MockSlackPopupFooter,
  };
});

describe('SlackPopup', () => {
  const mockOnClose = vi.fn();

  setupTestEnvironment(() => {
    vi.resetAllMocks();

    mockSendToSlack.mockResolvedValue({ success: true });
    mockCopyToClipboard.mockResolvedValue(true);
    mockLoadWebhooks.mockResolvedValue(defaultWebhooks);
    mockLoadLastUsedWebhookName.mockResolvedValue('Default');
    mockGeneratePreviewMessage.mockReturnValue('Test PR message');
  });

  it('renders the SlackPopup component', async () => {
    render(<SlackPopup onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
      expect(mockLoadWebhooks).toHaveBeenCalled();
    });

    expect(screen.getByTestId('mock-content')).toBeInTheDocument();
  });

  it('preselects the last-used webhook name on mount', async () => {
    render(<SlackPopup onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
      expect(mockLoadWebhooks).toHaveBeenCalled();
      expect(mockLoadLastUsedWebhookName).toHaveBeenCalled();
      expect(mockGeneratePreviewMessage).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(methods.setValue).toHaveBeenCalledWith('webhookName', 'Default', { shouldValidate: true });
      expect(methods.setValue).toHaveBeenCalledWith('message', 'Test PR message');
    });
  });

  it('handles form submission', async () => {
    render(<SlackPopup onClose={mockOnClose} />);

    await waitFor(() => expect(mockCheckSlackConfig).toHaveBeenCalled());

    const form = screen.getByTestId('mock-content').closest('form');
    fireEvent.submit(form!);

    await waitFor(() => expect(mockSendToSlack).toHaveBeenCalled());

    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'Message sent to Slack',
      type: 'success',
    });
  });

  it('handles errors during form submission', async () => {
    mockSendToSlack.mockResolvedValueOnce({ success: false, error: 'Failed to send' });

    render(<SlackPopup onClose={mockOnClose} />);

    await waitFor(() => expect(mockCheckSlackConfig).toHaveBeenCalled());

    const form = screen.getByTestId('mock-content').closest('form');
    fireEvent.submit(form!);

    await waitFor(() => expect(mockSendToSlack).toHaveBeenCalled());

    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'Failed to send',
      type: 'error',
    });
  });

  it('handles exceptions during form submission', async () => {
    mockSendToSlack.mockRejectedValueOnce(new Error('Network error'));

    render(<SlackPopup onClose={mockOnClose} />);

    await waitFor(() => expect(mockCheckSlackConfig).toHaveBeenCalled());

    const form = screen.getByTestId('mock-content').closest('form');
    fireEvent.submit(form!);

    await waitFor(() => expect(mockSendToSlack).toHaveBeenCalled());

    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'An error occurred while sending the message.',
      type: 'error',
    });
  });

  it('copies the current message to the clipboard', async () => {
    render(<SlackPopup onClose={mockOnClose} />);

    await waitFor(() => expect(mockCheckSlackConfig).toHaveBeenCalled());

    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();

    const mockedFooter = vi.mocked(SlackPopupFooter);
    const handleCopyToClipboardProp =
      mockedFooter.mock.calls[mockedFooter.mock.calls.length - 1][0].handleCopyToClipboard;

    expect(typeof handleCopyToClipboardProp).toBe('function');

    await handleCopyToClipboardProp();

    expect(mockCopyToClipboard).toHaveBeenCalledWith('Test message');
    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'Message copied to clipboard',
      type: 'success',
    });
  });

  it('reports an error when clipboard copy fails', async () => {
    mockCopyToClipboard.mockResolvedValueOnce(false);

    render(<SlackPopup onClose={mockOnClose} />);

    await waitFor(() => expect(mockCheckSlackConfig).toHaveBeenCalled());

    const mockedFooter = vi.mocked(SlackPopupFooter);
    const handleCopyToClipboardProp =
      mockedFooter.mock.calls[mockedFooter.mock.calls.length - 1][0].handleCopyToClipboard;

    await handleCopyToClipboardProp();

    expect(mockCopyToClipboard).toHaveBeenCalledWith('Test message');
    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'Failed to copy message. Please try again.',
      type: 'error',
    });
  });

  it('warns when asked to copy an empty message', async () => {
    (methods.getValues.mockImplementation as any)((key: any) => {
      if (key === 'message') return '';
      if (key === 'webhookName') return 'Default';
      return { message: '', webhookName: 'Default' };
    });

    render(<SlackPopup onClose={mockOnClose} />);

    await waitFor(() => expect(mockCheckSlackConfig).toHaveBeenCalled());

    const mockedFooter = vi.mocked(SlackPopupFooter);
    const handleCopyToClipboardProp =
      mockedFooter.mock.calls[mockedFooter.mock.calls.length - 1][0].handleCopyToClipboard;

    await handleCopyToClipboardProp();

    expect(mockCopyToClipboard).not.toHaveBeenCalled();
    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'No message to copy. Please enter a message first.',
      type: 'warning',
    });
  });

  it('delegates keyboard events to useUIHelpers', async () => {
    render(<SlackPopup onClose={mockOnClose} />);

    await waitFor(() => expect(mockCheckSlackConfig).toHaveBeenCalled());

    const popupDiv = screen.getByTestId('mock-content').closest('div');
    fireEvent.keyDown(popupDiv!, { key: 'Escape' });

    expect(mockHandleKeyDown).toHaveBeenCalled();
  });
});
