/**
 * Chrome API polyfill to ensure all Chrome extension APIs are properly available
 * This helps with bundling issues where Chrome APIs might not be recognized
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Debug logger interface
interface DebugLogger {
  log: (component: string, message: string | undefined, data?: unknown) => void;
  error: (component: string, message: string | undefined, error?: Error | unknown) => void;
}

// Simple debug logger
const debug: DebugLogger = {
  log: function (component: string, message: string | undefined, data?: unknown) {
    if (isDevelopment) {
      console.log(`[DEBUG][${component}] ${message}`, data || '');
    }
  },
  error: function (component: string, message: string | undefined, error?: Error | unknown) {
    if (isDevelopment || (error && (error as Error).message)) {
      console.error(`[ERROR][${component}] ${message}`, error || '');
    }
  },
};

// Export debug for use in other modules
export { debug };

// Ensure chrome object exists
if (typeof chrome === 'undefined') {
  debug.log('ChromePolyfill', 'Chrome object not found, creating polyfill');
  (window as { chrome?: unknown }).chrome = {};
}

// Ensure runtime exists
if (!chrome.runtime) {
  debug.log('ChromePolyfill', 'chrome.runtime not found, creating polyfill');
  chrome.runtime = {} as typeof chrome.runtime;
}

// Ensure runtime.id exists
if (!chrome.runtime.id) {
  debug.log('ChromePolyfill', 'chrome.runtime.id not found, creating empty placeholder');
  // This is a fallback and might not work in all contexts
  chrome.runtime.id = '';
}

// Ensure openOptionsPage exists
if (!chrome.runtime.openOptionsPage) {
  debug.log('ChromePolyfill', 'chrome.runtime.openOptionsPage not found, creating polyfill');

  // Define custom implementation
  const openOptionsPageImpl = function (callback?: () => void) {
    debug.log('ChromePolyfill', 'openOptionsPage polyfill called');

    // In content scripts, we should delegate to the background script
    if (chrome.runtime.sendMessage) {
      debug.log('ChromePolyfill', 'Delegating openOptionsPage to background script');
      chrome.runtime.sendMessage({ message: 'openOptionsPage' }, (response) => {
        debug.log('ChromePolyfill', 'Options page opened via background', response);
        if (callback) callback();
      });
      return;
    }

    // Direct approach as fallback
    try {
      if (chrome.runtime.id) {
        const optionsUrl = 'chrome-extension://' + chrome.runtime.id + '/options.html';
        debug.log('ChromePolyfill', 'Opening options page directly', {
          url: optionsUrl,
        });
        if (chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: optionsUrl }, () => {
            if (callback) callback();
          });
        } else {
          window.open(optionsUrl, '_blank');
          if (callback) callback();
        }
      } else {
        debug.error('ChromePolyfill', 'Cannot open options page: chrome.runtime.id not available');
        if (callback) callback();
      }
    } catch (error) {
      debug.error('ChromePolyfill', 'Error in openOptionsPage polyfill', error);
      if (callback) callback();
    }
  };

  // Assign the implementation
  chrome.runtime.openOptionsPage = openOptionsPageImpl as typeof chrome.runtime.openOptionsPage;
}

// Export chrome object to ensure it's available
export default chrome;
