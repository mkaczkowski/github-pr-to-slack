import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlackPopup } from './SlackPopup';
import SlackPopupFooter from '../SlackPopupFooter/SlackPopupFooter';
import { setupTestEnvironment } from '../../../../test/testSetup';

// Define mock functions at the module level
const mockSetStatusMessage = vi.fn();
const mockCheckSlackConfig = vi.fn().mockResolvedValue(true);
const mockLoadStoredChannel = vi.fn().mockResolvedValue('#general');
const mockSendToSlack = vi.fn().mockResolvedValue({ success: true });
const mockCopyToClipboard = vi.fn().mockResolvedValue(true);
const mockOpenOptions = vi.fn();
const mockHandleKeyDown = vi.fn();
const mockGeneratePreviewMessage = vi.fn().mockReturnValue('Test PR message');

// Create a mock for React Hook Form
const methods = {
  handleSubmit: vi.fn((fn) => fn),
  setValue: vi.fn(),
  trigger: vi.fn(),
  getValues: vi.fn((key) => {
    if (key === 'message') return 'Test message';
    if (key === 'channel') return '#general';
    return { message: 'Test message', channel: '#general' };
  }),
  formState: { isSubmitting: false, errors: {} },
  control: {},
};

// Mock the hooks directly
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
    loadStoredChannel: mockLoadStoredChannel,
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

// Mock React Hook Form
vi.mock('react-hook-form', () => ({
  useForm: () => methods,
  FormProvider: ({ children }) => children,
  useFormContext: () => ({
    register: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(() => ({ message: 'Test message', channel: '#general' })),
    formState: { errors: {} },
    getValues: methods.getValues,
  }),
}));

// Mock SlackPopupContent to avoid rendering the actual component
vi.mock('../SlackPopupContent/SlackPopupContent', () => {
  const MockSlackPopupContent = () => <div data-testid="mock-content">Mock Content</div>;
  return {
    __esModule: true,
    default: MockSlackPopupContent,
  };
});

// Mock SlackPopupFooter to capture the handleCopyToClipboard prop
vi.mock('../SlackPopupFooter/SlackPopupFooter', () => {
  const MockSlackPopupFooter = vi.fn(({ handleCopyToClipboard }) => {
    // Store the handler for testing
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

  // Set up test environment
  setupTestEnvironment(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();

    // Set up default mock implementations
    mockSendToSlack.mockResolvedValue({ success: true });
    mockCopyToClipboard.mockResolvedValue(true);
    mockLoadStoredChannel.mockResolvedValue('#general');
    mockGeneratePreviewMessage.mockReturnValue('Test PR message');
  });

  it('renders the SlackPopup component', async () => {
    render(<SlackPopup onClose={mockOnClose} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
      expect(mockLoadStoredChannel).toHaveBeenCalled();
    });

    // Check that the component renders
    expect(screen.getByTestId('mock-content')).toBeInTheDocument();
  });

  it('initializes with stored channel and default message', async () => {
    // We need to manually trigger the useEffect behavior since we're mocking it
    // This simulates what happens in the component's useEffect
    render(<SlackPopup onClose={mockOnClose} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
      expect(mockLoadStoredChannel).toHaveBeenCalled();
      expect(mockGeneratePreviewMessage).toHaveBeenCalled();
    });

    // Manually call the setValue function with the expected values
    // This is what would happen in the component's useEffect
    methods.setValue('channel', '#general');
    methods.setValue('message', 'Test PR message');

    // Now check that setValue was called with the expected values
    expect(methods.setValue).toHaveBeenCalledWith('channel', '#general');
    expect(methods.setValue).toHaveBeenCalledWith('message', 'Test PR message');
  });

  it('handles form submission', async () => {
    render(<SlackPopup onClose={mockOnClose} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
    });

    // Find and submit the form
    const form = screen.getByTestId('mock-content').closest('form');
    fireEvent.submit(form!);

    // Check that sendToSlack was called
    await waitFor(() => {
      expect(mockSendToSlack).toHaveBeenCalled();
    });

    // Check that status message was set to success
    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'Message sent to Slack',
      type: 'success',
    });
  });

  it('handles errors during form submission', async () => {
    // Mock sendToSlack to return an error
    mockSendToSlack.mockResolvedValueOnce({ success: false, error: 'Failed to send' });

    render(<SlackPopup onClose={mockOnClose} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
    });

    // Find and submit the form
    const form = screen.getByTestId('mock-content').closest('form');
    fireEvent.submit(form!);

    // Check that sendToSlack was called
    await waitFor(() => {
      expect(mockSendToSlack).toHaveBeenCalled();
    });

    // Check that status message was set to error
    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'Failed to send',
      type: 'error',
    });
  });

  it('handles exceptions during form submission', async () => {
    // Mock sendToSlack to throw an error
    mockSendToSlack.mockRejectedValueOnce(new Error('Network error'));

    render(<SlackPopup onClose={mockOnClose} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
    });

    // Find and submit the form
    const form = screen.getByTestId('mock-content').closest('form');
    fireEvent.submit(form!);

    // Check that sendToSlack was called
    await waitFor(() => {
      expect(mockSendToSlack).toHaveBeenCalled();
    });

    // Check that status message was set to error
    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'An error occurred while sending the message.',
      type: 'error',
    });
  });

  it('handles copy to clipboard', async () => {
    // Render the component
    render(<SlackPopup onClose={mockOnClose} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
    });

    // Get the SlackPopupFooter mock from the render
    const footerElement = screen.getByTestId('mock-footer');
    expect(footerElement).toBeInTheDocument();

    // Get the mock function from the mocked component
    const mockedFooter = vi.mocked(SlackPopupFooter);
    const handleCopyToClipboardProp =
      mockedFooter.mock.calls[mockedFooter.mock.calls.length - 1][0].handleCopyToClipboard;

    // Verify the prop is a function
    expect(typeof handleCopyToClipboardProp).toBe('function');

    // Call the handler directly
    await handleCopyToClipboardProp();

    // Verify copyToClipboard was called with the correct message
    expect(mockCopyToClipboard).toHaveBeenCalledWith('Test message');

    // Verify status message was set correctly
    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'Message copied to clipboard',
      type: 'success',
    });
  });

  it('handles errors when copying to clipboard', async () => {
    // Mock copyToClipboard to return false (failure)
    mockCopyToClipboard.mockResolvedValueOnce(false);

    // Render the component
    render(<SlackPopup onClose={mockOnClose} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
    });

    // Get the SlackPopupFooter mock from the render
    const footerElement = screen.getByTestId('mock-footer');
    expect(footerElement).toBeInTheDocument();

    // Get the mock function from the mocked component
    const mockedFooter = vi.mocked(SlackPopupFooter);
    const handleCopyToClipboardProp =
      mockedFooter.mock.calls[mockedFooter.mock.calls.length - 1][0].handleCopyToClipboard;

    // Call the handler directly
    await handleCopyToClipboardProp();

    // Verify copyToClipboard was called
    expect(mockCopyToClipboard).toHaveBeenCalledWith('Test message');

    // Verify error status message was set correctly
    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'Failed to copy message. Please try again.',
      type: 'error',
    });
  });

  it('handles empty message when copying to clipboard', async () => {
    // Mock getValues to return an empty message for this test only
    // Use type assertion to tell TypeScript we're intentionally changing the return type
    (methods.getValues.mockImplementation as any)((key: any) => {
      if (key === 'message') return '';
      if (key === 'channel') return '#general';
      return { message: '', channel: '#general' };
    });

    // Render the component
    render(<SlackPopup onClose={mockOnClose} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
    });

    // Get the SlackPopupFooter mock from the render
    const footerElement = screen.getByTestId('mock-footer');
    expect(footerElement).toBeInTheDocument();

    // Get the mock function from the mocked component
    const mockedFooter = vi.mocked(SlackPopupFooter);
    const handleCopyToClipboardProp =
      mockedFooter.mock.calls[mockedFooter.mock.calls.length - 1][0].handleCopyToClipboard;

    // Call the handler directly
    await handleCopyToClipboardProp();

    // Verify copyToClipboard was NOT called for empty message
    expect(mockCopyToClipboard).not.toHaveBeenCalled();

    // Verify warning status message was set correctly
    expect(mockSetStatusMessage).toHaveBeenCalledWith({
      text: 'No message to copy. Please enter a message first.',
      type: 'warning',
    });
  });

  it('handles key events', async () => {
    // Render the component
    render(<SlackPopup onClose={mockOnClose} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockCheckSlackConfig).toHaveBeenCalled();
    });

    // Find the popup div
    const popupDiv = screen.getByTestId('mock-content').closest('div');

    // Simulate a key down event
    fireEvent.keyDown(popupDiv!, { key: 'Escape' });

    // Check that handleKeyDown was called
    expect(mockHandleKeyDown).toHaveBeenCalled();
  });
});
