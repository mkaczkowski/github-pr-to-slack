/**
 * Storage utility functions for the GitHub PR to Slack extension
 */

import { debug } from './chrome-polyfill';
import { SlackWebhook } from '../types/webhook';

const WEBHOOKS_KEY = 'slackWebhooks';
const LEGACY_WEBHOOK_URL_KEY = 'slackWebhookUrl';
const LAST_USED_WEBHOOK_KEY = 'github-to-slack-last-webhook';
const LEGACY_CHANNEL_KEY = 'github-to-slack-channel';

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

const isWebhookArray = (value: unknown): value is SlackWebhook[] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      typeof (entry as SlackWebhook).name === 'string' &&
      typeof (entry as SlackWebhook).url === 'string',
  );

/**
 * Get the list of configured Slack webhooks.
 * Migrates the legacy single-webhook key (`slackWebhookUrl`) into a one-entry
 * list on first read and clears the legacy key.
 */
export const getSlackWebhooks = (): Promise<SlackWebhook[]> => {
  debug.log('Storage', 'Getting Slack webhooks from storage');
  return new Promise<SlackWebhook[]>((resolve) => {
    try {
      chrome.storage.sync.get([WEBHOOKS_KEY, LEGACY_WEBHOOK_URL_KEY], (result) => {
        const stored = result[WEBHOOKS_KEY];
        if (isWebhookArray(stored) && stored.length > 0) {
          resolve(stored);
          return;
        }

        const legacyUrl = result[LEGACY_WEBHOOK_URL_KEY];
        if (typeof legacyUrl === 'string' && legacyUrl.length > 0) {
          const migrated: SlackWebhook[] = [{ name: 'Default', url: legacyUrl }];
          debug.log('Storage', 'Migrating legacy slackWebhookUrl into slackWebhooks list');
          chrome.storage.sync.set({ [WEBHOOKS_KEY]: migrated }, () => {
            chrome.storage.sync.remove(LEGACY_WEBHOOK_URL_KEY, () => {
              resolve(migrated);
            });
          });
          return;
        }

        resolve([]);
      });
    } catch (error) {
      debug.error('Storage', 'Exception retrieving Slack webhooks', error);
      resolve([]);
    }
  });
};

/**
 * Save the list of Slack webhooks to Chrome storage.
 */
export const saveSlackWebhooks = (webhooks: SlackWebhook[]): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      debug.log('Storage', 'Saving Slack webhooks', { count: webhooks.length });
      chrome.storage.sync.set({ [WEBHOOKS_KEY]: webhooks }, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          debug.error('Storage', 'Error saving Slack webhooks', error);
          reject(error);
          return;
        }
        debug.log('Storage', 'Slack webhooks saved successfully');
        resolve();
      });
    } catch (error) {
      debug.error('Storage', 'Exception saving Slack webhooks', error);
      reject(error);
    }
  });
};

/**
 * Look up a saved webhook by name.
 */
export const getWebhookByName = async (name: string): Promise<SlackWebhook | undefined> => {
  const webhooks = await getSlackWebhooks();
  return webhooks.find((entry) => entry.name === name);
};

/**
 * Get the last-used webhook name from Chrome storage.
 * Ignores and clears the legacy `github-to-slack-channel` key if present.
 */
export const getLastUsedWebhookName = (): Promise<string> => {
  debug.log('Storage', 'Getting last-used webhook name from storage');
  return new Promise<string>((resolve) => {
    try {
      chrome.storage.sync.get([LAST_USED_WEBHOOK_KEY, LEGACY_CHANNEL_KEY], (result) => {
        const name = result[LAST_USED_WEBHOOK_KEY] || '';
        if (typeof result[LEGACY_CHANNEL_KEY] === 'string') {
          chrome.storage.sync.remove(LEGACY_CHANNEL_KEY);
        }
        debug.log('Storage', 'Retrieved last-used webhook name', { name: name || '(empty)' });
        resolve(name);
      });
    } catch (error) {
      debug.error('Storage', 'Exception retrieving last-used webhook name', error);
      resolve('');
    }
  });
};

/**
 * Save the last-used webhook name to Chrome storage.
 */
export const storeLastUsedWebhookName = (name: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      debug.log('Storage', 'Saving last-used webhook name');
      chrome.storage.sync.set({ [LAST_USED_WEBHOOK_KEY]: name }, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          debug.error('Storage', 'Error saving last-used webhook name', error);
          reject(error);
          return;
        }
        debug.log('Storage', 'Last-used webhook name saved successfully');
        resolve();
      });
    } catch (error) {
      debug.error('Storage', 'Error storing last-used webhook name', error);
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
