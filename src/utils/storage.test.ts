import { describe, it, expect, vi } from 'vitest';
import {
  getGitHubHost,
  saveGitHubHost,
  getSlackWebhookUrl,
  saveSlackWebhookUrl,
  getStoredChannel,
  storeChannel,
  getThemePreference,
  saveThemePreference,
} from './storage';
import { chromeMock, mockChromeStorageSync } from '../test/mocks/chrome';
import { setupChromePolyfillMock } from '../test/setupMocks';
import { setupTestEnvironment } from '../test/testSetup';

// Set up test environment
setupTestEnvironment(() => {
  // Set up Chrome polyfill mock
  setupChromePolyfillMock();

  // Replace global chrome with our mock
  global.chrome = chromeMock as unknown as typeof chrome;
});

describe('Storage Utilities', () => {
  describe('getGitHubHost', () => {
    it('should return the stored GitHub host', async () => {
      // Arrange
      mockChromeStorageSync({ githubHost: 'github.example.com' });

      // Act
      const result = await getGitHubHost();

      // Assert
      expect(result).toBe('github.example.com');
      expect(vi.mocked(chromeMock.storage.sync.get)).toHaveBeenCalledWith('githubHost', expect.any(Function));
    });

    it('should return empty string if none is stored', async () => {
      // Arrange
      mockChromeStorageSync({});

      // Act
      const result = await getGitHubHost();

      // Assert
      expect(result).toBe('');
      expect(vi.mocked(chromeMock.storage.sync.get)).toHaveBeenCalledWith('githubHost', expect.any(Function));
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      vi.mocked(chromeMock.storage.sync.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Act
      const result = await getGitHubHost();

      // Assert
      expect(result).toBe('');
    });
  });

  describe('saveGitHubHost', () => {
    it('should save GitHub host to storage', async () => {
      // Setup mock implementation
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

      await saveGitHubHost('github.company.com');

      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
        { githubHost: 'github.company.com' },
        expect.any(Function),
      );
    });

    it('should handle chrome.runtime.lastError', async () => {
      // Setup mock implementation with lastError
      const mockError = { message: 'Storage error' };
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        // Use type assertion for lastError
        (chromeMock.runtime as any).lastError = mockError;
        if (callback) callback();
        return Promise.resolve();
      });

      await expect(saveGitHubHost('github.company.com')).rejects.toEqual(mockError);

      // Clear lastError for subsequent tests
      (chromeMock.runtime as any).lastError = null;
    });

    it('should handle exceptions', async () => {
      // Make chrome.storage.sync.set throw an error
      chromeMock.storage.sync.set.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(saveGitHubHost('github.company.com')).rejects.toThrow('Storage error');
    });
  });

  describe('getSlackWebhookUrl', () => {
    it('should retrieve Slack webhook URL from storage', async () => {
      // Setup mock data
      mockChromeStorageSync({
        slackWebhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      });

      const url = await getSlackWebhookUrl();

      expect(url).toBe('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX');
      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith('slackWebhookUrl', expect.any(Function));
    });

    it('should return empty string if Slack webhook URL is not in storage', async () => {
      // Setup mock data with no slackWebhookUrl
      mockChromeStorageSync({});

      const url = await getSlackWebhookUrl();

      expect(url).toBe('');
    });

    it('should handle errors gracefully', async () => {
      // Make chrome.storage.sync.get throw an error
      chromeMock.storage.sync.get.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const url = await getSlackWebhookUrl();

      expect(url).toBe('');
    });
  });

  describe('saveSlackWebhookUrl', () => {
    it('should save Slack webhook URL to storage', async () => {
      // Setup mock implementation
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

      await saveSlackWebhookUrl('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX');

      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
        { slackWebhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX' },
        expect.any(Function),
      );
    });

    it('should handle chrome.runtime.lastError', async () => {
      // Setup mock implementation with lastError
      const mockError = { message: 'Storage error' };
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        // Use type assertion for lastError
        (chromeMock.runtime as any).lastError = mockError;
        if (callback) callback();
        return Promise.resolve();
      });

      await expect(
        saveSlackWebhookUrl('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'),
      ).rejects.toEqual(mockError);

      // Clear lastError for subsequent tests
      (chromeMock.runtime as any).lastError = null;
    });

    it('should handle exceptions', async () => {
      // Make chrome.storage.sync.set throw an error
      chromeMock.storage.sync.set.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(
        saveSlackWebhookUrl('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'),
      ).rejects.toThrow('Storage error');
    });
  });

  describe('getStoredChannel', () => {
    it('should retrieve stored Slack channel from storage', async () => {
      // Setup mock data
      mockChromeStorageSync({ 'github-to-slack-channel': '#general' });

      const channel = await getStoredChannel();

      expect(channel).toBe('#general');
      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith('github-to-slack-channel', expect.any(Function));
    });

    it('should return empty string if channel is not in storage', async () => {
      // Setup mock data with no channel
      mockChromeStorageSync({});

      const channel = await getStoredChannel();

      expect(channel).toBe('');
    });

    it('should handle errors gracefully', async () => {
      // Make chrome.storage.sync.get throw an error
      chromeMock.storage.sync.get.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const channel = await getStoredChannel();

      expect(channel).toBe('');
    });
  });

  describe('storeChannel', () => {
    it('should save Slack channel to storage', async () => {
      // Setup mock implementation
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

      await storeChannel('#general');

      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
        { 'github-to-slack-channel': '#general' },
        expect.any(Function),
      );
    });

    it('should handle chrome.runtime.lastError', async () => {
      // Setup mock implementation with lastError
      const mockError = { message: 'Storage error' };
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        // Use type assertion for lastError
        (chromeMock.runtime as any).lastError = mockError;
        if (callback) callback();
        return Promise.resolve();
      });

      await expect(storeChannel('#general')).rejects.toEqual(mockError);

      // Clear lastError for subsequent tests
      (chromeMock.runtime as any).lastError = null;
    });

    it('should handle exceptions', async () => {
      // Make chrome.storage.sync.set throw an error
      chromeMock.storage.sync.set.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(storeChannel('#general')).rejects.toThrow('Storage error');
    });
  });

  describe('getThemePreference', () => {
    it('should retrieve theme preference from storage', async () => {
      // Setup mock data
      mockChromeStorageSync({ themePreference: 'dark' });

      const theme = await getThemePreference();

      expect(theme).toBe('dark');
      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith('themePreference', expect.any(Function));
    });

    it('should return "system" if theme preference is not in storage', async () => {
      // Setup mock data with no themePreference
      mockChromeStorageSync({});

      const theme = await getThemePreference();

      expect(theme).toBe('system');
    });

    it('should handle errors gracefully', async () => {
      // Make chrome.storage.sync.get throw an error
      chromeMock.storage.sync.get.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const theme = await getThemePreference();

      expect(theme).toBe('system');
    });
  });

  describe('saveThemePreference', () => {
    it('should save theme preference to storage', async () => {
      // Setup mock implementation
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

      await saveThemePreference('dark');

      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith({ themePreference: 'dark' }, expect.any(Function));
    });

    it('should handle chrome.runtime.lastError', async () => {
      // Setup mock implementation with lastError
      const mockError = { message: 'Storage error' };
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        // Use type assertion for lastError
        (chromeMock.runtime as any).lastError = mockError;
        if (callback) callback();
        return Promise.resolve();
      });

      await expect(saveThemePreference('dark')).rejects.toEqual(mockError);

      // Clear lastError for subsequent tests
      (chromeMock.runtime as any).lastError = null;
    });

    it('should handle exceptions', async () => {
      // Make chrome.storage.sync.set throw an error
      chromeMock.storage.sync.set.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(saveThemePreference('dark')).rejects.toThrow('Storage error');
    });
  });
});
