import { vi } from 'vitest';
import { TEST_CONSTANTS } from '../utils/testUtils';

const defaultWebhooks = [{ name: TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME, url: TEST_CONSTANTS.SLACK_WEBHOOK_URL }];

export const mockGetGitHubHost = vi.fn().mockResolvedValue(TEST_CONSTANTS.GITHUB_HOST);
export const mockSaveGitHubHost = vi.fn().mockResolvedValue(undefined);
export const mockGetSlackWebhooks = vi.fn().mockResolvedValue(defaultWebhooks);
export const mockSaveSlackWebhooks = vi.fn().mockResolvedValue(undefined);
export const mockGetWebhookByName = vi
  .fn()
  .mockImplementation(async (name: string) => defaultWebhooks.find((entry) => entry.name === name));
export const mockGetThemePreference = vi.fn().mockResolvedValue('system');
export const mockSaveThemePreference = vi.fn().mockResolvedValue(undefined);
export const mockGetLastUsedWebhookName = vi.fn().mockResolvedValue(TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME);
export const mockStoreLastUsedWebhookName = vi.fn().mockResolvedValue(undefined);

vi.mock('../../utils/storage', () => ({
  getGitHubHost: mockGetGitHubHost,
  saveGitHubHost: mockSaveGitHubHost,
  getSlackWebhooks: mockGetSlackWebhooks,
  saveSlackWebhooks: mockSaveSlackWebhooks,
  getWebhookByName: mockGetWebhookByName,
  getThemePreference: mockGetThemePreference,
  saveThemePreference: mockSaveThemePreference,
  getLastUsedWebhookName: mockGetLastUsedWebhookName,
  storeLastUsedWebhookName: mockStoreLastUsedWebhookName,
}));
