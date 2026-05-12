import { vi } from 'vitest';
import { TEST_CONSTANTS } from '../utils/testUtils';

/**
 * Mock implementation for useGithubPR hook
 */
export const mockUseGithubPR = () => {
  const mockGeneratePreviewMessage = vi.fn(() => TEST_CONSTANTS.TEST_MESSAGE);

  const useGithubPRMock = vi.fn(() => ({
    prInfo: {
      title: TEST_CONSTANTS.PR_TITLE,
      url: TEST_CONSTANTS.PR_URL,
      reviewers: TEST_CONSTANTS.PR_REVIEWERS,
      loc: TEST_CONSTANTS.PR_LOC,
    },
    generatePreviewMessage: mockGeneratePreviewMessage,
  }));

  vi.mock('../../pages/content/hooks/useGithubPR', () => ({
    useGithubPR: useGithubPRMock,
  }));

  return {
    useGithubPRMock,
    mockGeneratePreviewMessage,
  };
};

/**
 * Mock implementation for useSlack hook
 */
export const mockUseSlack = (
  options: {
    isConfigured?: boolean;
    statusMessage?: { text: string; type: string };
    webhooks?: Array<{ name: string; url: string }>;
    lastUsedWebhookName?: string;
  } = {},
) => {
  const {
    isConfigured = true,
    statusMessage = { text: '', type: '' },
    webhooks = [{ name: TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME, url: TEST_CONSTANTS.SLACK_WEBHOOK_URL }],
    lastUsedWebhookName = TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME,
  } = options;

  const mockSetStatusMessage = vi.fn();
  const mockCheckSlackConfig = vi.fn().mockResolvedValue(isConfigured);
  const mockLoadWebhooks = vi.fn().mockResolvedValue(webhooks);
  const mockLoadLastUsedWebhookName = vi.fn().mockResolvedValue(lastUsedWebhookName);
  const mockSendToSlack = vi.fn().mockResolvedValue({ success: true });

  const useSlackMock = vi.fn(() => ({
    isConfigured,
    statusMessage,
    setStatusMessage: mockSetStatusMessage,
    checkSlackConfig: mockCheckSlackConfig,
    loadWebhooks: mockLoadWebhooks,
    loadLastUsedWebhookName: mockLoadLastUsedWebhookName,
    sendToSlack: mockSendToSlack,
  }));

  vi.mock('../../pages/content/hooks/useSlack', () => ({
    useSlack: useSlackMock,
  }));

  return {
    useSlackMock,
    mockSetStatusMessage,
    mockCheckSlackConfig,
    mockLoadWebhooks,
    mockLoadLastUsedWebhookName,
    mockSendToSlack,
  };
};

/**
 * Mock implementation for useUIHelpers hook
 */
export const mockUseUIHelpers = () => {
  const mockCopyToClipboard = vi.fn();
  const mockShowNotification = vi.fn();

  const useUIHelpersMock = vi.fn(() => ({
    copyToClipboard: mockCopyToClipboard,
    showNotification: mockShowNotification,
  }));

  vi.mock('../../pages/content/hooks/useUIHelpers', () => ({
    useUIHelpers: useUIHelpersMock,
  }));

  return {
    useUIHelpersMock,
    mockCopyToClipboard,
    mockShowNotification,
  };
};

/**
 * Mock implementation for storage utilities
 */
export const mockStorageUtils = (
  options: {
    githubHost?: string;
    webhooks?: Array<{ name: string; url: string }>;
    themePreference?: string;
    lastUsedWebhookName?: string;
  } = {},
) => {
  const {
    githubHost = TEST_CONSTANTS.GITHUB_HOST,
    webhooks = [{ name: TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME, url: TEST_CONSTANTS.SLACK_WEBHOOK_URL }],
    themePreference = 'system',
    lastUsedWebhookName = TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME,
  } = options;

  const mockGetGitHubHost = vi.fn().mockResolvedValue(githubHost);
  const mockSaveGitHubHost = vi.fn().mockResolvedValue(undefined);
  const mockGetSlackWebhooks = vi.fn().mockResolvedValue(webhooks);
  const mockSaveSlackWebhooks = vi.fn().mockResolvedValue(undefined);
  const mockGetWebhookByName = vi
    .fn()
    .mockImplementation(async (name: string) => webhooks.find((entry) => entry.name === name));
  const mockGetThemePreference = vi.fn().mockResolvedValue(themePreference);
  const mockSaveThemePreference = vi.fn().mockResolvedValue(undefined);
  const mockGetLastUsedWebhookName = vi.fn().mockResolvedValue(lastUsedWebhookName);
  const mockStoreLastUsedWebhookName = vi.fn().mockResolvedValue(undefined);

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

  return {
    mockGetGitHubHost,
    mockSaveGitHubHost,
    mockGetSlackWebhooks,
    mockSaveSlackWebhooks,
    mockGetWebhookByName,
    mockGetThemePreference,
    mockSaveThemePreference,
    mockGetLastUsedWebhookName,
    mockStoreLastUsedWebhookName,
  };
};
