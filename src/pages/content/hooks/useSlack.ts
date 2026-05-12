import { useCallback, useState } from 'react';
import { debug } from '../../../utils/chrome-polyfill';
import { withErrorHandling } from '../../../utils/errorHandler';
import { getLastUsedWebhookName, getSlackWebhooks, storeLastUsedWebhookName } from '../../../utils/storage';
import { wrapSlackMentions } from '../../../utils/pr';
import { SlackWebhook } from '../../../types/webhook';

export interface SlackStatusMessage {
  text: string;
  type: string;
}

export interface SlackSendResult {
  success: boolean;
  error?: string;
}

export const useSlack = () => {
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<SlackStatusMessage>({
    text: '',
    type: '',
  });

  const checkSlackConfig = withErrorHandling(
    async (): Promise<boolean> => {
      const response = await chrome.runtime.sendMessage({
        message: 'checkSlackConfig',
      });

      setIsConfigured(response.configured);

      if (!response.configured) {
        setStatusMessage({
          text: 'Slack is not configured. Please go to extension options to set it up.',
          type: 'warning',
        });
      }

      return response.configured;
    },
    {
      context: 'Slack Configuration',
      setStatusMessage: (msg) => setStatusMessage(msg),
      logError: debug.error.bind(null, 'Slack', 'Error checking Slack config'),
    },
  );

  const loadWebhooks = useCallback(async (): Promise<SlackWebhook[]> => {
    try {
      return await getSlackWebhooks();
    } catch (error) {
      debug.error('Slack', 'Error loading webhooks', error);
      setStatusMessage({
        text: `Error loading webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
      return [];
    }
  }, []);

  const loadLastUsedWebhookName = useCallback(async (): Promise<string> => {
    try {
      return await getLastUsedWebhookName();
    } catch (error) {
      debug.error('Slack', 'Error loading last-used webhook name', error);
      return '';
    }
  }, []);

  const sendToSlack = withErrorHandling(
    async (data: { webhookName: string; message: string }): Promise<SlackSendResult> => {
      if (!data.webhookName) {
        setStatusMessage({
          text: 'Please pick a webhook',
          type: 'error',
        });
        return {
          success: false,
          error: 'Please pick a webhook',
        };
      }

      const formattedMessage = wrapSlackMentions(data.message);

      const result = await chrome.runtime.sendMessage({
        message: 'sendToSlack',
        data: {
          webhookName: data.webhookName,
          message: {
            text: formattedMessage,
          },
        },
      });

      if (result && result.success) {
        setStatusMessage({
          text: 'Message sent to Slack successfully!',
          type: 'success',
        });
        await storeLastUsedWebhookName(data.webhookName);
      } else if (result && result.error) {
        setStatusMessage({
          text: `Error sending to Slack: ${result.error}`,
          type: 'error',
        });
      }

      return result || { success: true };
    },
    {
      context: 'Sending to Slack',
      setStatusMessage: (msg) => setStatusMessage(msg),
      logError: debug.error.bind(null, 'Slack', 'Error sending to Slack'),
    },
  );

  return {
    isConfigured,
    statusMessage,
    setStatusMessage,
    checkSlackConfig,
    loadWebhooks,
    loadLastUsedWebhookName,
    sendToSlack,
  };
};
