import { vi } from 'vitest';

vi.mock('../../utils/storage', () => {
  return {
    getGitHubHost: vi.fn().mockResolvedValue('github.company.com'),
    saveGitHubHost: vi.fn().mockResolvedValue(undefined),
    getSlackWebhooks: vi
      .fn()
      .mockResolvedValue([
        { name: 'Default', url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX' },
      ]),
    saveSlackWebhooks: vi.fn().mockResolvedValue(undefined),
    getWebhookByName: vi.fn(),
    getThemePreference: vi.fn().mockResolvedValue('system'),
    saveThemePreference: vi.fn().mockResolvedValue(undefined),
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { App } from '../../pages/options/App';
import { chromeMock } from '../mocks/chrome';
import { setupChromeMocks } from '../mocks/chromeSetup';
import { setupMatchMediaMock, TEST_CONSTANTS, setupTestEnvironment } from '../utils/testUtils';
import * as storageUtils from '../../utils/storage';

const STANDARD_TIMEOUT = 2000;

const mockGetGitHubHost = vi.mocked(storageUtils.getGitHubHost);
const mockSaveGitHubHost = vi.mocked(storageUtils.saveGitHubHost);
const mockGetSlackWebhooks = vi.mocked(storageUtils.getSlackWebhooks);
const mockSaveSlackWebhooks = vi.mocked(storageUtils.saveSlackWebhooks);
const mockGetThemePreference = vi.mocked(storageUtils.getThemePreference);
const mockSaveThemePreference = vi.mocked(storageUtils.saveThemePreference);

const defaultWebhooks = [{ name: TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME, url: TEST_CONSTANTS.SLACK_WEBHOOK_URL }];

describe('Options Page Integration', () => {
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupTestEnvironment();

    setupChromeMocks();
    setupMatchMediaMock();

    chromeMock.storage.sync.set = vi.fn((_data, callback) => {
      if (callback) callback();
    });

    vi.clearAllMocks();

    mockGetGitHubHost.mockResolvedValue(TEST_CONSTANTS.GITHUB_HOST);
    mockSaveGitHubHost.mockResolvedValue(undefined);
    mockGetSlackWebhooks.mockResolvedValue(defaultWebhooks);
    mockSaveSlackWebhooks.mockResolvedValue(undefined);
    mockGetThemePreference.mockResolvedValue('system');
    mockSaveThemePreference.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('loads initial settings from storage and populates form fields', async () => {
    render(<App />);

    await waitFor(
      () => {
        expect(mockGetGitHubHost).toHaveBeenCalled();
        expect(mockGetSlackWebhooks).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );

    const githubHostInput = screen.getByLabelText(/GitHub Host/i);
    expect(githubHostInput).toHaveValue(TEST_CONSTANTS.GITHUB_HOST);

    const nameInput = screen.getByLabelText(/^Name$/i);
    expect(nameInput).toHaveValue(TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME);

    const webhookUrlInput = screen.getByLabelText(/Webhook URL/i);
    expect(webhookUrlInput).toHaveValue(TEST_CONSTANTS.SLACK_WEBHOOK_URL);
  });

  it('auto-saves the webhook list when the URL changes', async () => {
    render(<App />);

    await waitFor(() => expect(mockGetSlackWebhooks).toHaveBeenCalled(), { timeout: STANDARD_TIMEOUT });

    const webhookUrlInput = screen.getByLabelText(/Webhook URL/i);
    fireEvent.change(webhookUrlInput, {
      target: { value: TEST_CONSTANTS.UPDATED_SLACK_WEBHOOK_URL },
    });

    await waitFor(
      () => {
        expect(mockSaveSlackWebhooks).toHaveBeenCalledWith([
          { name: TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME, url: TEST_CONSTANTS.UPDATED_SLACK_WEBHOOK_URL },
        ]);
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('auto-saves after adding a new webhook row', async () => {
    render(<App />);

    await waitFor(() => expect(mockGetSlackWebhooks).toHaveBeenCalled(), { timeout: STANDARD_TIMEOUT });

    fireEvent.click(screen.getByRole('button', { name: /Add webhook/i }));

    const nameInputs = screen.getAllByPlaceholderText('e.g. #frontend');
    const urlInputs = screen.getAllByPlaceholderText('https://hooks.slack.com/services/...');
    expect(nameInputs).toHaveLength(2);
    expect(urlInputs).toHaveLength(2);

    fireEvent.change(nameInputs[1], { target: { value: 'backend' } });
    fireEvent.change(urlInputs[1], { target: { value: TEST_CONSTANTS.UPDATED_SLACK_WEBHOOK_URL } });

    await waitFor(
      () => {
        expect(mockSaveSlackWebhooks).toHaveBeenCalledWith([
          { name: TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME, url: TEST_CONSTANTS.SLACK_WEBHOOK_URL },
          { name: 'backend', url: TEST_CONSTANTS.UPDATED_SLACK_WEBHOOK_URL },
        ]);
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('shows a validation error for an invalid webhook URL', async () => {
    render(<App />);

    await waitFor(() => expect(mockGetSlackWebhooks).toHaveBeenCalled(), { timeout: STANDARD_TIMEOUT });

    const webhookUrlInput = screen.getByLabelText(/Webhook URL/i);
    fireEvent.change(webhookUrlInput, { target: { value: 'not-a-url' } });

    await waitFor(
      () => {
        expect(screen.getByText(/Please enter a valid Slack webhook URL/i)).toBeInTheDocument();
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('flags duplicate webhook names', async () => {
    render(<App />);

    await waitFor(() => expect(mockGetSlackWebhooks).toHaveBeenCalled(), { timeout: STANDARD_TIMEOUT });

    fireEvent.click(screen.getByRole('button', { name: /Add webhook/i }));

    const nameInputs = screen.getAllByPlaceholderText('e.g. #frontend');
    const urlInputs = screen.getAllByPlaceholderText('https://hooks.slack.com/services/...');
    fireEvent.change(nameInputs[1], { target: { value: TEST_CONSTANTS.DEFAULT_WEBHOOK_NAME } });
    fireEvent.change(urlInputs[1], { target: { value: TEST_CONSTANTS.UPDATED_SLACK_WEBHOOK_URL } });

    await waitFor(
      () => {
        expect(screen.getByText(/Webhook names must be unique/i)).toBeInTheDocument();
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('cleans hostname input by removing protocol and trailing slashes', async () => {
    render(<App />);

    await waitFor(() => expect(mockGetGitHubHost).toHaveBeenCalled(), { timeout: STANDARD_TIMEOUT });

    const githubHostInput = screen.getByLabelText(/GitHub Host/i);

    fireEvent.change(githubHostInput, { target: { value: 'https://github.newcompany.com' } });
    expect(githubHostInput).toHaveValue('github.newcompany.com');

    fireEvent.change(githubHostInput, { target: { value: 'github.newcompany.com/' } });
    expect(githubHostInput).toHaveValue('github.newcompany.com');

    fireEvent.change(githubHostInput, { target: { value: 'http://github.newcompany.com/' } });
    expect(githubHostInput).toHaveValue('github.newcompany.com');
  });

  it('shows an error message and still renders the form when storage fails', async () => {
    mockGetGitHubHost.mockRejectedValueOnce(new Error('Storage error'));
    mockGetSlackWebhooks.mockRejectedValueOnce(new Error('Storage error'));

    render(<App />);

    await waitFor(
      () => {
        expect(screen.getByText(/Error loading settings/i)).toBeInTheDocument();
      },
      { timeout: STANDARD_TIMEOUT },
    );

    expect(screen.getByLabelText(/GitHub Host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Webhook URL/i)).toBeInTheDocument();
  });
});
