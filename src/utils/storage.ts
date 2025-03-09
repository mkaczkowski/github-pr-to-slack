/**
 * Storage utility functions for the GitHub PR to Slack extension
 */

import { debug } from './chrome-polyfill';

/**
 * Get GitHub host from Chrome storage
 */
export const getGitHubHost = (): Promise<string> => {
  debug.log('Storage', 'Getting GitHub host from storage');
  return new Promise<string>((resolve) => {
    try {
      chrome.storage.sync.get('githubHost', (result) => {
        const githubHost = result.githubHost || '';

        debug.log('Storage', 'Retrieved GitHub host', {
          host: githubHost || '(empty)',
        });

        resolve(githubHost);
      });
    } catch (error) {
      debug.error('Storage', 'Exception retrieving GitHub host', error);
      resolve('');
    }
  });
};

/**
 * Save GitHub host to Chrome storage
 */
export const saveGitHubHost = (host: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      debug.log('Storage', 'Saving GitHub host');
      chrome.storage.sync.set({ githubHost: host }, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          debug.error('Storage', 'Error saving GitHub host', error);
          reject(error);
          return;
        }
        debug.log('Storage', 'GitHub host saved successfully');
        resolve();
      });
    } catch (error) {
      debug.error('Storage', 'Exception saving GitHub host', error);
      reject(error);
    }
  });
};

/**
 * Get Slack webhook URL from Chrome storage
 */
export const getSlackWebhookUrl = (): Promise<string> => {
  debug.log('Storage', 'Getting Slack webhook URL from storage');
  return new Promise<string>((resolve) => {
    try {
      chrome.storage.sync.get('slackWebhookUrl', (result) => {
        const webhookUrl = result.slackWebhookUrl || '';

        debug.log('Storage', 'Retrieved Slack webhook URL', {
          url: webhookUrl ? '(set)' : '(empty)',
        });

        resolve(webhookUrl);
      });
    } catch (error) {
      debug.error('Storage', 'Exception retrieving Slack webhook URL', error);
      resolve('');
    }
  });
};

/**
 * Save Slack webhook URL to Chrome storage
 */
export const saveSlackWebhookUrl = (url: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      debug.log('Storage', 'Calling chrome.storage.sync.set for Slack webhook URL');
      chrome.storage.sync.set({ slackWebhookUrl: url }, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          debug.error('Storage', 'Error saving Slack webhook URL', error);
          reject(error);
          return;
        }

        // TODO remove
        debug.log('Storage', 'Slack webhook URL saved successfully', url);
        resolve();
      });
    } catch (error) {
      debug.error('Storage', 'Exception saving Slack webhook URL', error);
      reject(error);
    }
  });
};

/**
 * Get stored Slack channel from Chrome storage
 */
export const getStoredChannel = (): Promise<string> => {
  debug.log('Storage', 'Getting stored Slack channel from storage');
  return new Promise<string>((resolve) => {
    try {
      chrome.storage.sync.get('github-to-slack-channel', (result) => {
        const channel = result['github-to-slack-channel'] || '';
        debug.log('Storage', 'Retrieved stored Slack channel', { channel: channel || '(empty)' });
        resolve(channel);
      });
    } catch (error) {
      debug.error('Storage', 'Exception retrieving stored Slack channel', error);
      resolve('');
    }
  });
};

/**
 * Store Slack channel in Chrome storage
 */
export const storeChannel = (channel: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      debug.log('Storage', 'Saving Slack channel');
      chrome.storage.sync.set({ 'github-to-slack-channel': channel }, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          debug.error('Storage', 'Error saving Slack channel', error);
          reject(error);
          return;
        }
        debug.log('Storage', 'Slack channel saved successfully');
        resolve();
      });
    } catch (error) {
      debug.error('Slack', 'Error storing channel', error);
      reject(error);
    }
  });
};

/**
 * Get theme preference from Chrome storage
 * @returns Promise resolving to 'light', 'dark', or 'system'
 */
export const getThemePreference = (): Promise<string> => {
  debug.log('Storage', 'Getting theme preference from storage');
  return new Promise<string>((resolve) => {
    try {
      chrome.storage.sync.get('themePreference', (result) => {
        const theme = result.themePreference || 'system';
        debug.log('Storage', 'Retrieved theme preference', { theme });
        resolve(theme);
      });
    } catch (error) {
      debug.error('Storage', 'Exception retrieving theme preference', error);
      resolve('system');
    }
  });
};

/**
 * Save theme preference to Chrome storage
 * @param theme 'light', 'dark', or 'system'
 */
export const saveThemePreference = (theme: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      debug.log('Storage', 'Saving theme preference');
      chrome.storage.sync.set({ themePreference: theme }, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          debug.error('Storage', 'Error saving theme preference', error);
          reject(error);
          return;
        }
        debug.log('Storage', 'Theme preference saved successfully');
        resolve();
      });
    } catch (error) {
      debug.error('Storage', 'Exception saving theme preference', error);
      reject(error);
    }
  });
};
