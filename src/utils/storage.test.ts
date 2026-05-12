import { describe, it, expect, vi } from 'vitest';
import {
  getGitHubHost,
  saveGitHubHost,
  getSlackWebhooks,
  saveSlackWebhooks,
  getWebhookByName,
  getLastUsedWebhookName,
  storeLastUsedWebhookName,
  getThemePreference,
  saveThemePreference,
} from './storage';
import { chromeMock, mockChromeStorageSync } from '../test/mocks/chrome';
import { setupChromePolyfillMock } from '../test/setupMocks';
import { setupTestEnvironment } from '../test/testSetup';

setupTestEnvironment(() => {
  setupChromePolyfillMock();
  global.chrome = chromeMock as unknown as typeof chrome;
});

describe('Storage Utilities', () => {
  describe('getGitHubHost', () => {
    it('returns the stored GitHub host', async () => {
      mockChromeStorageSync({ githubHost: 'github.example.com' });
      const result = await getGitHubHost();
      expect(result).toBe('github.example.com');
    });

    it('returns empty string if none is stored', async () => {
      mockChromeStorageSync({});
      const result = await getGitHubHost();
      expect(result).toBe('');
    });

    it('handles errors gracefully', async () => {
      vi.mocked(chromeMock.storage.sync.get).mockImplementation(() => {
        throw new Error('Storage error');
      });
      const result = await getGitHubHost();
      expect(result).toBe('');
    });
  });

  describe('saveGitHubHost', () => {
    it('saves GitHub host to storage', async () => {
      chromeMock.storage.sync.set.mockImplementation((_items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });
      await saveGitHubHost('github.company.com');
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
        { githubHost: 'github.company.com' },
        expect.any(Function),
      );
    });

    it('handles chrome.runtime.lastError', async () => {
      const mockError = { message: 'Storage error' };
      chromeMock.storage.sync.set.mockImplementation((_items, callback) => {
        (chromeMock.runtime as any).lastError = mockError;
        if (callback) callback();
        return Promise.resolve();
      });
      await expect(saveGitHubHost('github.company.com')).rejects.toEqual(mockError);
      (chromeMock.runtime as any).lastError = null;
    });

    it('handles exceptions', async () => {
      chromeMock.storage.sync.set.mockImplementation(() => {
        throw new Error('Storage error');
      });
      await expect(saveGitHubHost('github.company.com')).rejects.toThrow('Storage error');
    });
  });

  describe('getSlackWebhooks', () => {
    it('returns the stored webhook list', async () => {
      const webhooks = [{ name: 'Default', url: 'https://hooks.slack.com/services/A/B/C' }];
      mockChromeStorageSync({ slackWebhooks: webhooks });

      const result = await getSlackWebhooks();

      expect(result).toEqual(webhooks);
    });

    it('returns empty list when neither new nor legacy key exists', async () => {
      mockChromeStorageSync({});

      const result = await getSlackWebhooks();

      expect(result).toEqual([]);
    });

    it('migrates a legacy slackWebhookUrl into the new list and clears the old key', async () => {
      const legacyUrl = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      mockChromeStorageSync({ slackWebhookUrl: legacyUrl });

      const setCalls: Array<Record<string, unknown>> = [];
      chromeMock.storage.sync.set.mockImplementation((items, callback) => {
        setCalls.push(items);
        if (callback) callback();
        return Promise.resolve();
      });

      const removeCalls: string[] = [];
      chromeMock.storage.sync.remove.mockImplementation((key, callback) => {
        removeCalls.push(key as string);
        if (callback) callback();
        return Promise.resolve();
      });

      const result = await getSlackWebhooks();

      expect(result).toEqual([{ name: 'Default', url: legacyUrl }]);
      expect(setCalls).toEqual([{ slackWebhooks: [{ name: 'Default', url: legacyUrl }] }]);
      expect(removeCalls).toEqual(['slackWebhookUrl']);
    });

    it('handles errors gracefully', async () => {
      chromeMock.storage.sync.get.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const result = await getSlackWebhooks();
      expect(result).toEqual([]);
    });
  });

  describe('saveSlackWebhooks', () => {
    it('writes the webhook list under the slackWebhooks key', async () => {
      chromeMock.storage.sync.set.mockImplementation((_items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

      const webhooks = [
        { name: 'frontend', url: 'https://hooks.slack.com/services/A/B/C' },
        { name: 'backend', url: 'https://hooks.slack.com/services/D/E/F' },
      ];
      await saveSlackWebhooks(webhooks);

      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith({ slackWebhooks: webhooks }, expect.any(Function));
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
      const mockError = { message: 'Storage error' };
      chromeMock.storage.sync.set.mockImplementation((_items, callback) => {
        (chromeMock.runtime as any).lastError = mockError;
        if (callback) callback();
        return Promise.resolve();
      });

      await expect(saveSlackWebhooks([])).rejects.toEqual(mockError);
      (chromeMock.runtime as any).lastError = null;
    });
  });

  describe('getWebhookByName', () => {
    it('returns the matching webhook', async () => {
      const webhooks = [
        { name: 'frontend', url: 'https://hooks.slack.com/services/A/B/C' },
        { name: 'backend', url: 'https://hooks.slack.com/services/D/E/F' },
      ];
      mockChromeStorageSync({ slackWebhooks: webhooks });

      const result = await getWebhookByName('backend');

      expect(result).toEqual(webhooks[1]);
    });

    it('returns undefined when no webhook has that name', async () => {
      mockChromeStorageSync({ slackWebhooks: [{ name: 'frontend', url: 'https://hooks.slack.com/services/A/B/C' }] });
      const result = await getWebhookByName('missing');
      expect(result).toBeUndefined();
    });
  });

  describe('getLastUsedWebhookName', () => {
    it('returns the stored last-used webhook name', async () => {
      mockChromeStorageSync({ 'github-to-slack-last-webhook': 'frontend' });
      const result = await getLastUsedWebhookName();
      expect(result).toBe('frontend');
    });

    it('returns empty string when nothing is stored', async () => {
      mockChromeStorageSync({});
      const result = await getLastUsedWebhookName();
      expect(result).toBe('');
    });

    it('clears the legacy channel key if it is still present', async () => {
      mockChromeStorageSync({ 'github-to-slack-channel': '#general' });

      const removeCalls: string[] = [];
      chromeMock.storage.sync.remove.mockImplementation((key, callback) => {
        removeCalls.push(key as string);
        if (callback) callback();
        return Promise.resolve();
      });

      await getLastUsedWebhookName();

      expect(removeCalls).toContain('github-to-slack-channel');
    });
  });

  describe('storeLastUsedWebhookName', () => {
    it('saves the webhook name to storage', async () => {
      chromeMock.storage.sync.set.mockImplementation((_items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

      await storeLastUsedWebhookName('frontend');

      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
        { 'github-to-slack-last-webhook': 'frontend' },
        expect.any(Function),
      );
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
      const mockError = { message: 'Storage error' };
      chromeMock.storage.sync.set.mockImplementation((_items, callback) => {
        (chromeMock.runtime as any).lastError = mockError;
        if (callback) callback();
        return Promise.resolve();
      });

      await expect(storeLastUsedWebhookName('frontend')).rejects.toEqual(mockError);
      (chromeMock.runtime as any).lastError = null;
    });
  });

  describe('getThemePreference', () => {
    it('returns stored theme preference', async () => {
      mockChromeStorageSync({ themePreference: 'dark' });
      const theme = await getThemePreference();
      expect(theme).toBe('dark');
    });

    it('falls back to "system" when nothing is stored', async () => {
      mockChromeStorageSync({});
      const theme = await getThemePreference();
      expect(theme).toBe('system');
    });

    it('handles errors gracefully', async () => {
      chromeMock.storage.sync.get.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const theme = await getThemePreference();
      expect(theme).toBe('system');
    });
  });

  describe('saveThemePreference', () => {
    it('saves theme preference to storage', async () => {
      chromeMock.storage.sync.set.mockImplementation((_items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

      await saveThemePreference('dark');

      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith({ themePreference: 'dark' }, expect.any(Function));
    });

    it('handles chrome.runtime.lastError', async () => {
      const mockError = { message: 'Storage error' };
      chromeMock.storage.sync.set.mockImplementation((_items, callback) => {
        (chromeMock.runtime as any).lastError = mockError;
        if (callback) callback();
        return Promise.resolve();
      });

      await expect(saveThemePreference('dark')).rejects.toEqual(mockError);
      (chromeMock.runtime as any).lastError = null;
    });

    it('handles exceptions', async () => {
      chromeMock.storage.sync.set.mockImplementation(() => {
        throw new Error('Storage error');
      });
      await expect(saveThemePreference('dark')).rejects.toThrow('Storage error');
    });
  });
});
