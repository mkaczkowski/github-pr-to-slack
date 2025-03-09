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
 * @param options Configuration options for the mock
 */
export const mockUseSlack = (
  options: {
    isConfigured?: boolean;
    statusMessage?: { text: string; type: string };
    storedChannel?: string;
  } = {},
) => {
  const {
    isConfigured = true,
    statusMessage = { text: '', type: '' },
    storedChannel = TEST_CONSTANTS.DEFAULT_CHANNEL,
  } = options;

  const mockSetStatusMessage = vi.fn();
  const mockCheckSlackConfig = vi.fn().mockResolvedValue(isConfigured);
  const mockLoadStoredChannel = vi.fn().mockResolvedValue(storedChannel);
  const mockSendToSlack = vi.fn().mockResolvedValue({ success: true });

  const useSlackMock = vi.fn(() => ({
    isConfigured,
    statusMessage,
    setStatusMessage: mockSetStatusMessage,
    checkSlackConfig: mockCheckSlackConfig,
    loadStoredChannel: mockLoadStoredChannel,
    sendToSlack: mockSendToSlack,
  }));

  vi.mock('../../pages/content/hooks/useSlack', () => ({
    useSlack: useSlackMock,
  }));

  return {
    useSlackMock,
    mockSetStatusMessage,
    mockCheckSlackConfig,
    mockLoadStoredChannel,
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
    slackWebhookUrl?: string;
    themePreference?: string;
    storedChannel?: string;
  } = {},
) => {
  const {
    githubHost = TEST_CONSTANTS.GITHUB_HOST,
    slackWebhookUrl = TEST_CONSTANTS.SLACK_WEBHOOK_URL,
    themePreference = 'system',
    storedChannel = TEST_CONSTANTS.DEFAULT_CHANNEL,
  } = options;

  const mockGetGitHubHost = vi.fn().mockResolvedValue(githubHost);
  const mockSaveGitHubHost = vi.fn().mockResolvedValue(undefined);
  const mockGetSlackWebhookUrl = vi.fn().mockResolvedValue(slackWebhookUrl);
  const mockSaveSlackWebhookUrl = vi.fn().mockResolvedValue(undefined);
  const mockGetThemePreference = vi.fn().mockResolvedValue(themePreference);
  const mockSaveThemePreference = vi.fn().mockResolvedValue(undefined);
  const mockGetStoredChannel = vi.fn().mockResolvedValue(storedChannel);
  const mockStoreChannel = vi.fn().mockResolvedValue(undefined);

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

  return {
    mockGetGitHubHost,
    mockSaveGitHubHost,
    mockGetSlackWebhookUrl,
    mockSaveSlackWebhookUrl,
    mockGetThemePreference,
    mockSaveThemePreference,
    mockGetStoredChannel,
    mockStoreChannel,
  };
};
