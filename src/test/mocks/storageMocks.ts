import { vi } from 'vitest';
import { TEST_CONSTANTS } from '../utils/testUtils';

// Create mock functions
export const mockGetGitHubHost = vi.fn().mockResolvedValue(TEST_CONSTANTS.GITHUB_HOST);
export const mockSaveGitHubHost = vi.fn().mockResolvedValue(undefined);
export const mockGetSlackWebhookUrl = vi.fn().mockResolvedValue(TEST_CONSTANTS.SLACK_WEBHOOK_URL);
export const mockSaveSlackWebhookUrl = vi.fn().mockResolvedValue(undefined);
export const mockGetThemePreference = vi.fn().mockResolvedValue('system');
export const mockSaveThemePreference = vi.fn().mockResolvedValue(undefined);
export const mockGetStoredChannel = vi.fn().mockResolvedValue(TEST_CONSTANTS.DEFAULT_CHANNEL);
export const mockStoreChannel = vi.fn().mockResolvedValue(undefined);

// Setup mock for storage utilities
vi.mock('../../utils/storage', () => ({
  getGitHubHost: mockGetGitHubHost,
  saveGitHubHost: mockSaveGitHubHost,
  getSlackWebhookUrl: mockGetSlackWebhookUrl,
  saveSlackWebhookUrl: mockSaveSlackWebhookUrl,
  getThemePreference: mockGetThemePreference,
  saveThemePreference: mockSaveThemePreference,
  getStoredChannel: mockGetStoredChannel,
  storeChannel: mockStoreChannel,
}));
