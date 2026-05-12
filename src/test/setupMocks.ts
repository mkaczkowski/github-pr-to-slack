import { vi } from 'vitest';

/**
 * Sets up common mocks for React DOM client
 */
export function setupReactDomMock() {
  vi.mock('react-dom/client', () => ({
    createRoot: vi.fn(() => ({
      render: vi.fn(),
    })),
  }));
}

/**
 * Sets up common mocks for Chrome polyfill
 */
export function setupChromePolyfillMock() {
  vi.mock('../../utils/chrome-polyfill', () => ({
    debug: {
      log: vi.fn(),
      error: vi.fn(),
    },
  }));
}

/**
 * Sets up common mocks for App component
 */
export function setupAppMock() {
  vi.mock('../../pages/options/App', () => ({
    default: vi.fn(() => null),
  }));
}

/**
 * Sets up common mocks for GitHub PR hooks
 * @param options Configuration options for GitHub PR mocks
 */
export function setupGithubPRMock(
  options: {
    title?: string;
    url?: string;
    reviewers?: string[];
    loc?: { added: number; deleted: number };
    previewMessage?: string;
  } = {},
) {
  const {
    title = 'Test PR Title',
    url = 'https://github.com/owner/repo/pull/123',
    reviewers = ['user1', 'user2'],
    loc = { added: 100, deleted: 50 },
    previewMessage = 'Test PR message',
  } = options;

  const prInfo = { title, url, reviewers, loc };
  const mockGeneratePreviewMessage = vi.fn().mockReturnValue(previewMessage);

  vi.mock('../../pages/content/hooks/useGithubPR', () => ({
    useGithubPR: vi.fn(() => ({
      prInfo,
      generatePreviewMessage: mockGeneratePreviewMessage,
    })),
  }));

  return {
    prInfo,
    mockGeneratePreviewMessage,
  };
}

/**
 * Sets up common mocks for Slack hooks
 * @param options Configuration options for Slack mocks
 */
export function setupSlackMock(
  options: {
    isConfigured?: boolean;
    statusMessage?: { text: string; type: string };
    webhooks?: Array<{ name: string; url: string }>;
    lastUsedWebhookName?: string;
  } = {},
) {
  const {
    isConfigured = true,
    statusMessage = { text: '', type: '' },
    webhooks = [{ name: 'Default', url: 'https://hooks.slack.com/services/A/B/C' }],
    lastUsedWebhookName = 'Default',
  } = options;

  const mockSetStatusMessage = vi.fn();
  const mockCheckSlackConfig = vi.fn().mockResolvedValue(isConfigured);
  const mockLoadWebhooks = vi.fn().mockResolvedValue(webhooks);
  const mockLoadLastUsedWebhookName = vi.fn().mockResolvedValue(lastUsedWebhookName);
  const mockSendToSlack = vi.fn().mockResolvedValue({ success: true });

  vi.mock('../../pages/content/hooks/useSlack', () => ({
    useSlack: vi.fn(() => ({
      isConfigured,
      statusMessage,
      setStatusMessage: mockSetStatusMessage,
      checkSlackConfig: mockCheckSlackConfig,
      loadWebhooks: mockLoadWebhooks,
      loadLastUsedWebhookName: mockLoadLastUsedWebhookName,
      sendToSlack: mockSendToSlack,
    })),
  }));

  return {
    mockSetStatusMessage,
    mockCheckSlackConfig,
    mockLoadWebhooks,
    mockLoadLastUsedWebhookName,
    mockSendToSlack,
  };
}

/**
 * Sets up common mocks for UI helper hooks
 */
export function setupUIHelpersMock() {
  const mockCopyToClipboard = vi.fn().mockResolvedValue(true);
  const mockShowNotification = vi.fn();

  vi.mock('../../pages/content/hooks/useUIHelpers', () => ({
    useUIHelpers: vi.fn(() => ({
      copyToClipboard: mockCopyToClipboard,
      showNotification: mockShowNotification,
    })),
  }));

  return {
    mockCopyToClipboard,
    mockShowNotification,
  };
}

/**
 * Sets up common mocks for storage utilities
 * @param options Configuration options for storage mocks
 */
export function setupStorageMock(
  options: {
    githubHost?: string;
    webhooks?: Array<{ name: string; url: string }>;
    themePreference?: string;
    lastUsedWebhookName?: string;
  } = {},
) {
  const {
    githubHost = 'github.com',
    webhooks = [{ name: 'Default', url: 'https://hooks.slack.com/services/xxx/yyy/zzz' }],
    themePreference = 'system',
    lastUsedWebhookName = 'Default',
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
}

/**
 * Sets up common mocks for React Hook Form
 * @param defaultValues Default form values
 */
export function setupReactHookFormMock(defaultValues: Record<string, any> = {}) {
  const values = {
    message: 'Test message',
    webhookName: 'Default',
    ...defaultValues,
  };

  const methods = {
    handleSubmit: vi.fn((fn) => fn),
    setValue: vi.fn(),
    trigger: vi.fn(),
    getValues: vi.fn((key?: string) => {
      if (key) return values[key];
      return values;
    }),
    formState: { isSubmitting: false, errors: {} },
    control: {},
  };

  vi.mock('react-hook-form', async () => {
    const actual = await vi.importActual('react-hook-form');
    return {
      ...actual,
      useForm: () => methods,
      FormProvider: ({ children }: { children: React.ReactNode }) => children,
      useFormContext: () => ({
        register: vi.fn(),
        setValue: vi.fn(),
        watch: vi.fn(() => values),
        formState: { errors: {} },
        getValues: methods.getValues,
      }),
    };
  });

  return { methods };
}
