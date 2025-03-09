import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../../test/utils/testing-library';
import SlackPopupFooter from './SlackPopupFooter';

describe('SlackPopupFooter', () => {
  const mockHandleCopyToClipboard = vi.fn();
  const mockHandleSendToSlack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Copy to Clipboard button', () => {
    render(
      <SlackPopupFooter
        handleCopyToClipboard={mockHandleCopyToClipboard}
        handleSendToSlack={mockHandleSendToSlack}
        isSending={false}
        isConfigured={true}
      />,
    );

    const copyButton = screen.getByText('Copy to Clipboard');
    expect(copyButton).toBeInTheDocument();
  });

  it('renders the Send button when isConfigured is true', () => {
    render(
      <SlackPopupFooter
        handleCopyToClipboard={mockHandleCopyToClipboard}
        handleSendToSlack={mockHandleSendToSlack}
        isSending={false}
        isConfigured={true}
      />,
    );

    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeInTheDocument();
  });

  it('does not render the Send button when isConfigured is false', () => {
    render(
      <SlackPopupFooter
        handleCopyToClipboard={mockHandleCopyToClipboard}
        handleSendToSlack={mockHandleSendToSlack}
        isSending={false}
        isConfigured={false}
      />,
    );

    const sendButton = screen.queryByText('Send');
    expect(sendButton).not.toBeInTheDocument();
  });

  it('disables the Copy to Clipboard button when isSending is true', () => {
    render(
      <SlackPopupFooter
        handleCopyToClipboard={mockHandleCopyToClipboard}
        handleSendToSlack={mockHandleSendToSlack}
        isSending={true}
        isConfigured={true}
      />,
    );

    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
    expect(copyButton).toBeDisabled();
  });

  it('calls handleCopyToClipboard when Copy to Clipboard button is clicked', async () => {
    const { user } = render(
      <SlackPopupFooter
        handleCopyToClipboard={mockHandleCopyToClipboard}
        handleSendToSlack={mockHandleSendToSlack}
        isSending={false}
        isConfigured={true}
      />,
    );

    const copyButton = screen.getByText('Copy to Clipboard');
    await user.click(copyButton);

    expect(mockHandleCopyToClipboard).toHaveBeenCalledTimes(1);
  });

  it('calls handleSendToSlack when Send button is clicked', async () => {
    const { user } = render(
      <SlackPopupFooter
        handleCopyToClipboard={mockHandleCopyToClipboard}
        handleSendToSlack={mockHandleSendToSlack}
        isSending={false}
        isConfigured={true}
      />,
    );

    const sendButton = screen.getByText('Send');
    await user.click(sendButton);

    expect(mockHandleSendToSlack).toHaveBeenCalledTimes(1);
  });
});
