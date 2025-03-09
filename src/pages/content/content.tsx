import React from 'react';
import { createRoot } from 'react-dom/client';
import { debug } from '../../utils/chrome-polyfill';
import { isGitHubHost, isOnPRPage, isOpenPRPage, isSupportedUrl } from '../../utils/github';
import { getGitHubHost } from '../../utils/storage';
import GithubSlackButton from './components/GithubSlackButton/GithubSlackButton';
import SlackPopup from './components/SlackPopup/SlackPopup';
import './styles.css';
import '../../theme-switcher.css';

// Debounce timer for initialization
let initDebounceTimer: number | null = null;

/**
 * Check if the current URL is a supported site and reinitialize if needed
 * @param delayMs - Delay in milliseconds before reinitializing
 * @param source - Source of the reinitialization for logging
 */
const checkAndReinitialize = async (delayMs = 300, source = 'unknown'): Promise<void> => {
  // Clear any existing timer to debounce multiple rapid updates
  if (initDebounceTimer) {
    window.clearTimeout(initDebounceTimer);
  }

  // Schedule initialization after a delay to avoid multiple calls
  initDebounceTimer = window.setTimeout(async () => {
    // Check if the current URL is a supported site before reinitializing
    const isSupported = await isSupportedUrl(window.location.href);
    if (isSupported) {
      debug.log('Content', `Reinitializing after ${source} on supported site`);
      init();
    } else {
      debug.log('Content', `Not a supported site after ${source}, skipping reinitialization`);
    }
    initDebounceTimer = null;
  }, delayMs);
};

// Initialize the content script
const init = async () => {
  try {
    debug.log('Content', 'Content script initialized');

    // Get configured GitHub host
    const configuredHost = await getGitHubHost();
    debug.log('Content', 'Configured GitHub host', configuredHost);

    // Check if we're on a GitHub PR page
    const isGitHub = isGitHubHost(configuredHost);
    const isOpenPR = isGitHub && isOpenPRPage();
    debug.log('Content', 'Is open PR', isOpenPR);
    debug.log('Content', 'Is GitHub host', isGitHub);
    debug.log('Content', 'Current URL', window.location.href);
    debug.log('Content', 'Current hostname', window.location.hostname);
    debug.log('Content', 'Current pathname', window.location.pathname);

    if (isOpenPR) {
      debug.log('Content', 'Open GitHub PR page detected');
      injectButton();
    } else {
      debug.log('Content', 'Not an open GitHub PR page, skipping injection');
    }
  } catch (error) {
    debug.error('Content', 'Error initializing content script', error);
  }
};

// Inject the Slack button into the GitHub PR page
const injectButton = (): void => {
  try {
    debug.log('Content', 'Attempting to inject button');

    // Check if button already exists to prevent duplicate injections
    if (document.querySelector('.slack-button-container')) {
      debug.log('Content', 'Button already exists, skipping injection');
      return;
    }

    // Try different selectors for the actions container
    const selectors = [
      '.gh-header-actions',
      '.gh-header-meta',
      '.gh-header',
      '#partial-discussion-header .gh-header-actions',
      '#partial-discussion-header',
      '.js-issues-toolbar',
    ];

    let actionsContainer: Element | null = null;

    // Try each selector until we find a matching element
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      debug.log('Content', 'Selector', selector + ' - found:' + (element ? 'Yes' : 'No'));

      if (element) {
        actionsContainer = element;
        debug.log('Content', 'Using selector', selector);
        break;
      }
    }

    if (!actionsContainer) {
      debug.log('Content', 'Actions container not found');
      return;
    }

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'slack-button-container';
    actionsContainer.appendChild(buttonContainer);
    const root = createRoot(buttonContainer);
    root.render(<GithubSlackButton onClick={openSlackPopup} />);
    debug.log('Content', 'Slack button injected');
  } catch (error) {
    debug.error('Content', 'Error injecting button', error);
  }
};

// Open the Slack popup
const openSlackPopup = (): void => {
  try {
    // Create popup container
    const popupContainer = document.createElement('div');
    popupContainer.id = 'slack-popup-container';
    document.body.appendChild(popupContainer);

    // Render the popup
    const root = createRoot(popupContainer);
    root.render(
      <SlackPopup
        onClose={() => {
          root.unmount();
          document.body.removeChild(popupContainer);
        }}
      />,
    );

    debug.log('Content', 'Slack popup opened');
  } catch (error) {
    debug.error('Content', 'Error opening Slack popup', error);
  }
};

// Set up a MutationObserver to detect DOM changes that might indicate a page navigation
const setupMutationObserver = (): void => {
  debug.log('Content', 'Setting up MutationObserver');

  // Target elements that are likely to change during navigation in GitHub's SPA
  const targetNode = document.querySelector('main') || document.body;

  // Create an observer instance
  const observer = new MutationObserver(async () => {
    // Check if we need to reinitialize based on URL changes or significant DOM changes
    await checkAndReinitialize(300, 'DOM mutation');
  });

  // Configuration of the observer
  const config = {
    childList: true, // Watch for changes in direct children
    subtree: true, // Watch for changes in the entire subtree
    attributes: false, // Don't watch for attribute changes
    characterData: false, // Don't watch for character data changes
  };

  // Start observing
  observer.observe(targetNode, config);
  debug.log('Content', 'MutationObserver started');
};

// Set up History API listeners to detect SPA navigation
const setupHistoryListeners = (): void => {
  debug.log('Content', 'Setting up History API listeners');

  // Store the current URL to detect changes
  let currentUrl = window.location.href;

  // Function to handle URL changes
  const handleUrlChange = (method: string): void => {
    if (currentUrl !== window.location.href) {
      debug.log('Content', `URL changed via ${method}`, window.location.href);
      currentUrl = window.location.href;
      checkAndReinitialize(300, method);
    }
  };

  // Override history.pushState
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    // Call the original function first
    const result = originalPushState.apply(this, args);
    handleUrlChange('pushState');
    return result;
  };

  // Override history.replaceState
  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    // Call the original function first
    const result = originalReplaceState.apply(this, args);
    handleUrlChange('replaceState');
    return result;
  };

  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    handleUrlChange('popstate');
  });

  debug.log('Content', 'History API listeners set up');
};

// Initialize the content script when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    setupMutationObserver();
    setupHistoryListeners();
  });
} else {
  init();
  setupMutationObserver();
  setupHistoryListeners();
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.message === 'pageUpdated') {
    debug.log('Content', 'Page updated message received');
    checkAndReinitialize(500, 'background message');
  } else if (request.message === 'initializeContent') {
    debug.log('Content', 'Initialization message received from background script');
    // Initialize immediately when requested by the background script
    init();
    setupMutationObserver();
    setupHistoryListeners();
  }
  return true;
});
