/**
 * Slack utility functions for the GitHub PR to Slack extension
 */

import { debug } from './chrome-polyfill';
import { getSlackWebhookUrl } from './storage';

interface PRInfo {
  title: string;
  url: string;
  reviewers?: string[];
  loc?: string[];
  author?: string;
  number?: string;
  repo?: string;
}

interface SlackMessage {
  text: string;
  [key: string]: unknown;
}

interface SlackResponse {
  success: boolean;
  error?: string;
}

/**
 * Format PR information for Slack message
 */
export const formatSlackMessage = (prInfo: PRInfo, customMessage = ''): SlackMessage => {
  const { title, url, reviewers = [], loc = [] } = prInfo;

  // Format reviewers if available
  const assignedText =
    reviewers.length > 0
      ? `\nassigned: ${reviewers
          .map((reviewer) => {
            // Remove dots, @ symbols, and other special characters
            const sanitizedName = reviewer.replace(/[.@]/g, '').replace(/[^a-zA-Z0-9_-]/g, '');
            return `<@${sanitizedName}>`;
          })
          .join(', ')}`
      : '';

  // Add custom message if provided
  const customMessageText = customMessage ? `\n${customMessage}` : '';
  const locText = loc.length > 0 ? ` (${loc.join(', ')})` : '';

  return {
    text: `*${title}*${locText}\n<${url}>${assignedText}${customMessageText}`,
  };
};

/**
 * Send message to Slack using webhook
 */
export const sendToSlack = async (channel: string, message: SlackMessage): Promise<SlackResponse> => {
  try {
    // Get webhook URL from storage
    const webhookUrl = await getSlackWebhookUrl();

    debug.log('Slack', 'Sending message to Slack', {
      webhookUrl: webhookUrl ? 'configured' : 'missing',
    });
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured. Please go to extension options to set it up.');
    }

    debug.log('Slack', 'Message to be sent', {
      messageLength: message.text ? message.text.length : 0,
    });

    // Add channel to message
    const payload = {
      ...message,
      channel: channel,
    };

    debug.log('Slack', 'Prepared payload', {
      channel,
      textLength: payload.text ? payload.text.length : 0,
    });

    // Send to webhook
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      debug.log('Slack', 'Response received', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack API error: ${response.status} ${errorText}`);
      }

      return { success: true };
    } catch (networkError) {
      debug.error('Slack', 'Network error sending message', networkError);

      // Handle network errors specifically
      if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
        throw new Error(
          'Network error: could not connect to Slack. Please check your internet connection and try again.',
        );
      }
      throw networkError;
    }
  } catch (error) {
    debug.error('Slack', 'Error sending to Slack', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};
