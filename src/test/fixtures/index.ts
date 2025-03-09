/**
 * Test fixtures for common test data
 */

/**
 * Sample GitHub PR data
 */
export const samplePullRequest = {
  id: 12345,
  number: 123,
  title: 'Sample PR Title',
  html_url: 'https://github.com/user/repo/pull/123',
  user: {
    login: 'testuser',
    avatar_url: 'https://github.com/testuser.png',
  },
  body: 'This is a sample PR description',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-02T00:00:00Z',
  state: 'open',
  draft: false,
  head: {
    ref: 'feature-branch',
  },
  base: {
    ref: 'main',
  },
  requested_reviewers: [
    {
      login: 'reviewer1',
    },
    {
      login: 'reviewer2',
    },
  ],
};

/**
 * Sample Slack configuration
 */
export const sampleSlackConfig = {
  webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
  defaultChannel: '#general',
  username: 'GitHub PR Bot',
  iconEmoji: ':github:',
};

/**
 * Sample extension storage data
 */
export const sampleStorageData = {
  slackConfig: sampleSlackConfig,
  recentPRs: [
    {
      id: 12345,
      number: 123,
      title: 'Sample PR Title',
      url: 'https://github.com/user/repo/pull/123',
      sentToSlack: true,
      sentAt: '2023-01-02T12:00:00Z',
    },
  ],
  settings: {
    autoSendEnabled: false,
    notificationsEnabled: true,
    customTemplate: '{{title}} - {{url}}',
  },
};

/**
 * Sample GitHub repository data
 */
export const sampleRepository = {
  name: 'sample-repo',
  full_name: 'user/sample-repo',
  html_url: 'https://github.com/user/sample-repo',
  description: 'A sample repository for testing',
  owner: {
    login: 'user',
  },
};

/**
 * Helper function to create a custom PR object
 */
export const createPullRequest = (overrides = {}) => {
  return {
    ...samplePullRequest,
    ...overrides,
  };
};

/**
 * Helper function to create a custom Slack config
 */
export const createSlackConfig = (overrides = {}) => {
  return {
    ...sampleSlackConfig,
    ...overrides,
  };
};

/**
 * Helper function to create custom storage data
 */
export const createStorageData = (overrides = {}) => {
  return {
    ...sampleStorageData,
    ...overrides,
  };
};
