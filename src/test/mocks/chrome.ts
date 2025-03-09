import { vi } from 'vitest';

/**
 * Comprehensive Chrome API mock for testing
 * This mock covers the most commonly used Chrome APIs in extensions
 */
export const chromeMock = {
  // Storage API
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },

  // Runtime API
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({ version: '1.0.0' })),
    getURL: vi.fn((path) => `chrome-extension://mock-extension-id/${path}`),
    lastError: null,
    openOptionsPage: vi.fn(),
  },

  // Tabs API
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    executeScript: vi.fn(),
  },

  // Extension API
  extension: {
    getURL: vi.fn((path) => `chrome-extension://mock-extension-id/${path}`),
    getBackgroundPage: vi.fn(),
    isAllowedIncognitoAccess: vi.fn(),
  },

  // Notifications API
  notifications: {
    create: vi.fn(),
    clear: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },

  // Context Menus API
  contextMenus: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    removeAll: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },

  // Action API (formerly browserAction)
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    setIcon: vi.fn(),
    setTitle: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },

  // Permissions API
  permissions: {
    request: vi.fn(),
    contains: vi.fn(),
    remove: vi.fn(),
    onAdded: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },

  // Identity API
  identity: {
    getAuthToken: vi.fn(),
    removeCachedAuthToken: vi.fn(),
    launchWebAuthFlow: vi.fn(),
    getProfileUserInfo: vi.fn(),
  },

  // Web Request API
  webRequest: {
    onBeforeRequest: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onCompleted: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onErrorOccurred: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },

  // Helper method to reset all mocks
  __resetMocks: () => {
    vi.resetAllMocks();
  },
};

/**
 * Helper function to mock chrome.storage.sync.get
 * @param mockData The data to return from storage
 */
export const mockChromeStorageSync = (mockData: Record<string, any>) => {
  chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
    if (typeof keys === 'string') {
      const result = { [keys]: mockData[keys] };
      callback?.(result);
      return Promise.resolve(result);
    } else if (Array.isArray(keys)) {
      const result = keys.reduce((acc, key) => {
        acc[key] = mockData[key];
        return acc;
      }, {} as Record<string, any>);
      callback?.(result);
      return Promise.resolve(result);
    } else if (keys === null || keys === undefined || Object.keys(keys).length === 0) {
      callback?.(mockData);
      return Promise.resolve(mockData);
    } else {
      const result = Object.keys(keys).reduce((acc, key) => {
        acc[key] = mockData[key] ?? keys[key];
        return acc;
      }, {} as Record<string, any>);
      callback?.(result);
      return Promise.resolve(result);
    }
  });
};

/**
 * Helper function to mock chrome.runtime.sendMessage
 * @param response The response to return from sendMessage
 */
export const mockRuntimeSendMessage = (response: any) => {
  chromeMock.runtime.sendMessage.mockImplementation((_message, _options, callback) => {
    if (callback) {
      callback(response);
    }
    return Promise.resolve(response);
  });
};

/**
 * Helper function to mock chrome.tabs.query
 * @param tabs The tabs to return from the query
 */
export const mockTabsQuery = (tabs: any[]) => {
  chromeMock.tabs.query.mockImplementation((_queryInfo, callback) => {
    if (callback) {
      callback(tabs);
    }
    return Promise.resolve(tabs);
  });
};
