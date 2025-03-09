import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { chromeMock, mockChromeStorageSync } from '../mocks/chrome';

describe('Chrome API Mocks', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    chromeMock.__resetMocks();
  });

  afterEach(() => {
    // Additional cleanup if needed
  });

  describe('Storage API', () => {
    it('should mock chrome.storage.sync.get correctly', async () => {
      // Setup mock data
      const mockData = {
        slackConfig: {
          webhookUrl: 'https://hooks.slack.com/services/test',
          defaultChannel: '#general',
        },
        settings: {
          autoSendEnabled: true,
        },
      };

      // Configure the mock
      mockChromeStorageSync(mockData);

      // Test with string key
      const result1 = await chromeMock.storage.sync.get('slackConfig');
      expect(result1).toEqual({ slackConfig: mockData.slackConfig });

      // Test with array of keys
      const result2 = await chromeMock.storage.sync.get(['slackConfig', 'settings']);
      expect(result2).toEqual({
        slackConfig: mockData.slackConfig,
        settings: mockData.settings,
      });

      // Test with null (get all)
      const result3 = await chromeMock.storage.sync.get(null);
      expect(result3).toEqual(mockData);

      // Test with callback
      await new Promise<void>((resolve) => {
        chromeMock.storage.sync.get('slackConfig', (result) => {
          expect(result).toEqual({ slackConfig: mockData.slackConfig });
          resolve();
        });
      });
    });

    it('should mock chrome.storage.sync.set correctly', async () => {
      const dataToSet = { key: 'value' };

      // Setup the mock implementation
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

      // Test the promise-based API
      await expect(chromeMock.storage.sync.set(dataToSet)).resolves.toBeUndefined();

      // Verify the mock was called with the right data
      expect(chromeMock.storage.sync.set).toHaveBeenCalled();
      expect(chromeMock.storage.sync.set.mock.calls[0][0]).toEqual(dataToSet);

      // Test with callback
      await new Promise<void>((resolve) => {
        chromeMock.storage.sync.set(dataToSet, resolve);
      });

      expect(chromeMock.storage.sync.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('Runtime API', () => {
    it('should mock chrome.runtime.sendMessage correctly', async () => {
      const message = { action: 'test', data: { foo: 'bar' } };
      const mockResponse = { success: true };

      // Setup the mock implementation
      chromeMock.runtime.sendMessage.mockImplementation((msg, options, callback) => {
        if (callback) callback(mockResponse);
        return Promise.resolve(mockResponse);
      });

      // Test the promise-based API
      const response = await chromeMock.runtime.sendMessage(message);
      expect(response).toEqual(mockResponse);

      // Verify the mock was called with the right message
      expect(chromeMock.runtime.sendMessage).toHaveBeenCalled();
      expect(chromeMock.runtime.sendMessage.mock.calls[0][0]).toEqual(message);

      // Test with callback
      await new Promise<void>((resolve) => {
        chromeMock.runtime.sendMessage(message, {}, (response) => {
          expect(response).toEqual(mockResponse);
          resolve();
        });
      });
    });

    it('should mock chrome.runtime.onMessage listeners correctly', () => {
      const listener = vi.fn();

      // Add a listener
      chromeMock.runtime.onMessage.addListener(listener);
      expect(chromeMock.runtime.onMessage.addListener).toHaveBeenCalledWith(listener);

      // Remove the listener
      chromeMock.runtime.onMessage.removeListener(listener);
      expect(chromeMock.runtime.onMessage.removeListener).toHaveBeenCalledWith(listener);
    });
  });

  describe('Tabs API', () => {
    it('should mock chrome.tabs.query correctly', async () => {
      const mockTabs = [
        { id: 1, url: 'https://github.com/user/repo/pull/123' },
        { id: 2, url: 'https://example.com' },
      ];

      // Setup the mock implementation
      chromeMock.tabs.query.mockImplementation((queryInfo, callback) => {
        if (callback) callback(mockTabs);
        return Promise.resolve(mockTabs);
      });

      // Test the promise-based API
      const tabs = await chromeMock.tabs.query({ active: true, currentWindow: true });
      expect(tabs).toEqual(mockTabs);

      // Verify the mock was called with the right query
      expect(chromeMock.tabs.query).toHaveBeenCalled();
      expect(chromeMock.tabs.query.mock.calls[0][0]).toEqual({ active: true, currentWindow: true });

      // Test with callback
      await new Promise<void>((resolve) => {
        chromeMock.tabs.query({ active: true }, (tabs) => {
          expect(tabs).toEqual(mockTabs);
          resolve();
        });
      });
    });
  });
});
