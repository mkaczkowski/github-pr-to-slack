import { useCallback, useState } from 'react';
import { debug } from '../../../utils/chrome-polyfill';
import { withErrorHandling } from '../../../utils/errorHandler';
import { sendMessageToBackground } from '../../../utils/messaging';
import { getStoredChannel, storeChannel } from '../../../utils/storage';
import { wrapSlackMentions } from '../../../utils/pr';

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
      const response = await sendMessageToBackground({
        message: 'checkSlackConfig',
      });

      // A failed check says nothing about whether Slack is configured, so it
      // must not be reported to the user as "not configured".
      if (!response.success) {
        throw new Error(response.error || 'The background worker could not read the Slack configuration.');
      }

      if (typeof response.configured !== 'boolean') {
        throw new Error(`Unexpected checkSlackConfig response from the background worker: ${JSON.stringify(response)}`);
      }

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

  // Load stored channel from Chrome storage (asynchronous operation)
  const loadStoredChannel = useCallback(async () => {
    try {
      // Get the stored channel asynchronously
      return await getStoredChannel();
    } catch (error) {
      debug.error('Slack', 'Error loading stored channel', error);
      setStatusMessage({
        text: `Error loading stored channel: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const sendToSlack = withErrorHandling(
    async (data: { channel: string; message: string }): Promise<SlackSendResult> => {
      if (!data.channel) {
        setStatusMessage({
          text: 'Please enter a channel name',
          type: 'error',
        });
        return {
          success: false,
          error: 'Please enter a channel name',
        };
      }

      // Add <> around @mentions for Slack formatting using shared sanitizer
      const formattedMessage = wrapSlackMentions(data.message);

      const result = await sendMessageToBackground({
        message: 'sendToSlack',
        data: {
          channel: data.channel,
          message: {
            text: formattedMessage,
          },
        },
      });

      if (typeof result.success !== 'boolean') {
        throw new Error(`Unexpected sendToSlack response from the background worker: ${JSON.stringify(result)}`);
      }

      if (result.success) {
        setStatusMessage({
          text: 'Message sent to Slack successfully!',
          type: 'success',
        });
        // Store the channel asynchronously
        await storeChannel(data.channel);
      } else {
        setStatusMessage({
          text: `Error sending to Slack: ${result.error || 'Unknown error'}`,
          type: 'error',
        });
      }

      return { success: result.success, error: result.error };
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
    loadStoredChannel,
    sendToSlack,
  };
};
