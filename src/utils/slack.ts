/**
 * Slack utility functions for the GitHub PR to Slack extension
 */

import { debug } from './chrome-polyfill';
import { getWebhookByName } from './storage';
import { PRInfo, getPRFormattingData } from './pr';

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
  const { title, url } = prInfo;
  const { locText, sanitizedReviewers, sanitizedAuthor } = getPRFormattingData(prInfo);

  const assignedText =
    sanitizedReviewers.length > 0
      ? `\nassigned: ${sanitizedReviewers.map((reviewer) => `<@${reviewer}>`).join(', ')}`
      : '';

  const authorText = sanitizedAuthor ? `\nauthor: <@${sanitizedAuthor}>` : '';

  const customMessageText = customMessage ? `\n${customMessage}` : '';

  return {
    text: `*${title}*${locText}\n<${url}>${authorText}${assignedText}${customMessageText}`,
  };
};

/**
 * Send message to Slack using the webhook identified by name.
 * Each incoming webhook is bound to a channel on the Slack side, so the
 * `channel` field is intentionally omitted from the payload.
 */
export const sendToSlack = async (webhookName: string, message: SlackMessage): Promise<SlackResponse> => {
  try {
    const webhook = await getWebhookByName(webhookName);

    debug.log('Slack', 'Sending message to Slack', {
      webhookName,
      webhook: webhook ? 'found' : 'missing',
    });

    if (!webhook) {
      throw new Error(`Slack webhook "${webhookName}" not found. Please check your extension options.`);
    }

    debug.log('Slack', 'Message to be sent', {
      messageLength: message.text ? message.text.length : 0,
    });

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        body: JSON.stringify(message),
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
