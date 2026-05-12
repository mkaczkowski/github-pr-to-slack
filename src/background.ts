/**
 * Background script for the extension
 *
 * This script runs in the background and handles communication between
 * different parts of the extension.
 */

import { debug } from './utils/chrome-polyfill';
import { sendToSlack } from './utils/slack';
import { getSlackWebhooks } from './utils/storage';
import { isSupportedUrl } from './utils/github';

// Define icon paths
const ACTIVE_ICON = {
  16: 'icons/icon16.png',
  48: 'icons/icon48.png',
  128: 'icons/icon128.png',
};

const INACTIVE_ICON = {
  16: 'icons/icon16-disabled.png',
  48: 'icons/icon48-disabled.png',
  128: 'icons/icon128-disabled.png',
};

interface SlackMessageData {
  webhookName: string;
  message: unknown;
}

interface MessageRequest {
  message: string;
  data: SlackMessageData;
}

interface SlackResponse {
  success: boolean;
  error?: string;
  configured?: boolean;
  message?: string;
  status?: number;
  text?: () => Promise<string>;
}

interface SlackMessageObject {
  text: string;
  [key: string]: unknown;
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    debug.log('Background', 'First install - opening options page');
    chrome.runtime.openOptionsPage();
  }
});

/**
 * Update the extension icon based on whether the current tab is on a supported site
 */
const updateExtensionIcon = async (tabId: number, url: string | undefined): Promise<void> => {
  const isSupported = await isSupportedUrl(url);

  if (isSupported) {
    // On a supported site, use active icon
    chrome.action.setIcon({
      tabId,
      path: ACTIVE_ICON,
    });
  } else {
    // Not on a supported site, use inactive icon
    chrome.action.setIcon({
      tabId,
      path: INACTIVE_ICON,
    });
  }
};

// Handle browser action clicks (toolbar icon)
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab.id) {
      debug.error('Background', 'No tab ID available');
      return;
    }

    const tabId = tab.id; // Store tab.id in a variable to ensure it's not undefined

    // Check if the current URL is a supported GitHub PR page
    if (tab.url && (await isSupportedUrl(tab.url))) {
      debug.log('Background', 'Supported URL detected, injecting content script');

      try {
        // Execute content script in the active tab
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js'],
        });

        // Inject CSS
        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['content.css'],
        });

        // Send a message to the content script to initialize
        try {
          await chrome.tabs.sendMessage(tabId, { message: 'initializeContent' });
        } catch (error) {
          debug.log('Background', 'Error sending initialization message', error);
        }
      } catch (error) {
        debug.error('Background', 'Error injecting content script', error);
        // If we can't inject the content script, open the options page
        chrome.runtime.openOptionsPage();
      }
    } else {
      // Not on a supported page, open options
      debug.log('Background', 'Not on a supported page, opening options');
      chrome.runtime.openOptionsPage();
    }
  } catch (error) {
    debug.error('Background', 'Error in browser action handler', error);
    chrome.runtime.openOptionsPage();
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Update icon when tab URL changes or completes loading
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateExtensionIcon(tabId, tab.url).catch((error) => {
      debug.error('Background', 'Error updating extension icon', error);
    });
  }

  if (changeInfo.status === 'complete' && tab.url?.includes('github.com')) {
    debug.log('Background', 'GitHub tab updated', tabId);

    // Notify content script that the page has been updated
    chrome.tabs.sendMessage(tabId, { message: 'pageUpdated' }).catch((error) => {
      // Ignore errors from tabs that don't have our content script
      debug.log('Background', 'Error sending pageUpdated message', error);
    });
  }
});

// Listen for tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateExtensionIcon(activeInfo.tabId, tab.url).catch((error) => {
      debug.error('Background', 'Error updating extension icon', error);
    });
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // Handle theme change messages
    if (request.type === 'THEME_CHANGED') {
      debug.log('Background', 'Theme changed:', request.theme);

      // Forward the message to all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, request).catch((error) => {
              // Ignore errors from tabs that don't have our content script
              debug.log('Background', 'Error sending message to tab', { tabId: tab.id, error });
            });
          }
        });
      });

      return true; // Keep the message channel open for async response
    }

    // Handle Slack-related messages
    const { message, data } = request as MessageRequest;

    if (message === 'sendToSlack') {
      handleSlackMessage(data, sendResponse);
      return true; // Keep the message channel open for async response
    } else if (message === 'checkSlackConfig') {
      checkSlackConfig(sendResponse);
      return true; // Keep the message channel open for async response
    } else if (message === 'openOptionsPage') {
      openOptionsPage(sendResponse);
      return true; // Keep the message channel open for async response
    }
  } catch (error) {
    debug.error('Background', 'Error handling message', error);
    if (sendResponse) {
      sendResponse({ success: false, error: 'Internal error occurred' });
    }
  }
  return false;
});

// Open options page
async function openOptionsPage(sendResponse: (response: SlackResponse) => void): Promise<void> {
  try {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
  } catch (error) {
    debug.error('Background', 'Error opening options page', error);

    try {
      // Fallback to opening options page directly
      const optionsUrl = chrome.runtime.getURL('options.html');
      await chrome.tabs.create({ url: optionsUrl });
      sendResponse({ success: true });
    } catch (fallbackError) {
      debug.error('Background', 'Fallback method also failed', fallbackError);
      sendResponse({ success: false, error: 'Could not open options page' });
    }
  }
}

// Check Slack configuration
async function checkSlackConfig(sendResponse: (response: SlackResponse) => void): Promise<void> {
  try {
    const webhooks = await getSlackWebhooks();

    const configured = webhooks.length > 0;

    sendResponse({
      success: true,
      configured,
      message: configured
        ? 'Slack is configured'
        : 'Slack is not configured. Please go to extension options to set it up.',
    });
  } catch (error) {
    debug.error('Background', 'Error checking Slack config', error);
    sendResponse({
      success: false,
      configured: false,
      error: 'Could not check Slack configuration',
    });
  }
}

// Handle sending message to Slack
async function handleSlackMessage(
  data: SlackMessageData | undefined,
  sendResponse: (response: SlackResponse) => void,
): Promise<void> {
  if (!data || !data.webhookName) {
    debug.error('Background', 'Invalid Slack message data');
    sendResponse({
      success: false,
      error: 'Invalid Slack message data',
    });
    return;
  }

  try {
    // Check if Slack is configured
    const webhooks = await getSlackWebhooks();

    if (webhooks.length === 0) {
      debug.error('Background', 'Slack is not configured');
      sendResponse({
        success: false,
        error: 'No Slack webhooks configured',
      });
      return;
    }

    // Check for message
    if (!data.message) {
      debug.error('Background', 'Empty message');
      sendResponse({
        success: false,
        error: 'Message is required',
      });
      return;
    }

    let preparedMessage: SlackMessageObject;
    if (typeof data.message === 'string') {
      preparedMessage = { text: data.message };
    } else if (
      data.message &&
      typeof data.message === 'object' &&
      'text' in data.message &&
      typeof (data.message as { text: unknown }).text === 'string'
    ) {
      preparedMessage = data.message as SlackMessageObject;
    } else {
      preparedMessage = { text: String(data.message) };
    }

    try {
      // Send message to Slack
      const response = await sendToSlack(data.webhookName, preparedMessage);

      // Check for Slack API errors
      if (!response.success) {
        debug.error('Background', 'Error response from Slack API', {
          error: response.error,
        });

        sendResponse({
          success: false,
          error: response.error || 'Error sending message to Slack',
        });
        return;
      }

      sendResponse({ success: true });
    } catch (error) {
      debug.error('Background', 'Error sending to Slack', error);
      sendResponse({ success: false, error: String(error) });
    }
  } catch (error) {
    debug.error('Background', 'Error handling Slack message', error);
    sendResponse({ success: false, error: String(error) });
  }
}

debug.log('Background', 'Background script initialized');
