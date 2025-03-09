import { vi } from 'vitest';

// Mock the storage utilities at the top of the file
vi.mock('../../utils/storage', () => {
  return {
    getGitHubHost: vi.fn().mockResolvedValue('github.company.com'),
    saveGitHubHost: vi.fn().mockResolvedValue(undefined),
    getSlackWebhookUrl: vi
      .fn()
      .mockResolvedValue('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'),
    saveSlackWebhookUrl: vi.fn().mockResolvedValue(undefined),
    getThemePreference: vi.fn().mockResolvedValue('system'),
    saveThemePreference: vi.fn().mockResolvedValue(undefined),
  };
});

// Now import the rest
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { App } from '../../pages/options/App';
import { chromeMock } from '../mocks/chrome';
import { setupChromeMocks } from '../mocks/chromeSetup';
import { setupMatchMediaMock, TEST_CONSTANTS, setupTestEnvironment } from '../utils/testUtils';
import * as storageUtils from '../../utils/storage';

// Standard timeout for async operations with debounce
const STANDARD_TIMEOUT = 2000;

// Create type-safe mocks
const mockGetGitHubHost = vi.mocked(storageUtils.getGitHubHost);
const mockSaveGitHubHost = vi.mocked(storageUtils.saveGitHubHost);
const mockGetSlackWebhookUrl = vi.mocked(storageUtils.getSlackWebhookUrl);
const mockSaveSlackWebhookUrl = vi.mocked(storageUtils.saveSlackWebhookUrl);
const mockGetThemePreference = vi.mocked(storageUtils.getThemePreference);
const mockSaveThemePreference = vi.mocked(storageUtils.saveThemePreference);

describe('Options Page Integration', () => {
  // Store test environment cleanup
  let cleanup: () => void;

  beforeEach(() => {
    // Setup common test environment
    cleanup = setupTestEnvironment();

    // Setup Chrome mocks
    setupChromeMocks();

    // Setup matchMedia mock for theme detection
    setupMatchMediaMock();

    // Mock Chrome storage sync.set
    chromeMock.storage.sync.set = vi.fn((data, callback) => {
      if (callback) callback();
    });

    // Reset mock functions
    vi.clearAllMocks();

    // Reset mock implementations
    mockGetGitHubHost.mockResolvedValue(TEST_CONSTANTS.GITHUB_HOST);
    mockSaveGitHubHost.mockResolvedValue(undefined);
    mockGetSlackWebhookUrl.mockResolvedValue(TEST_CONSTANTS.SLACK_WEBHOOK_URL);
    mockSaveSlackWebhookUrl.mockResolvedValue(undefined);
    mockGetThemePreference.mockResolvedValue('system');
    mockSaveThemePreference.mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Clean up test environment
    cleanup();
  });

  it('should load initial settings from storage and populate form fields correctly', async () => {
    // Render the options page
    render(<App />);

    // Wait for settings to load from storage
    await waitFor(
      () => {
        expect(mockGetGitHubHost).toHaveBeenCalled();
        expect(mockGetSlackWebhookUrl).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );

    // Verify GitHub host input is populated with the correct value
    const githubHostInput = screen.getByLabelText(/GitHub Host/i);
    expect(githubHostInput).toHaveValue(TEST_CONSTANTS.GITHUB_HOST);

    // Verify Slack webhook URL input is populated with the correct value
    const slackWebhookInput = screen.getByLabelText(/Slack Webhook URL/i);
    expect(slackWebhookInput).toHaveValue(TEST_CONSTANTS.SLACK_WEBHOOK_URL);
  });

  it('should automatically save GitHub host when the input value changes', async () => {
    // Render the options page
    render(<App />);

    // Wait for settings to load from storage
    await waitFor(
      () => {
        expect(mockGetGitHubHost).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );

    // Change GitHub host to a new value
    const githubHostInput = screen.getByLabelText(/GitHub Host/i);
    fireEvent.change(githubHostInput, { target: { value: 'github.newcompany.com' } });

    // Wait for auto-save to trigger (the App component has a 500ms debounce)
    await waitFor(
      () => {
        expect(mockSaveGitHubHost).toHaveBeenCalledWith('github.newcompany.com');
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('should automatically save Slack webhook URL when the input value changes', async () => {
    // Render the options page
    render(<App />);

    // Wait for settings to load from storage
    await waitFor(
      () => {
        expect(mockGetSlackWebhookUrl).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );

    // Change Slack webhook URL to a new value
    const slackWebhookInput = screen.getByLabelText(/Slack Webhook URL/i);
    fireEvent.change(slackWebhookInput, {
      target: { value: TEST_CONSTANTS.UPDATED_SLACK_WEBHOOK_URL },
    });

    // Wait for auto-save to trigger (the App component has a 500ms debounce)
    await waitFor(
      () => {
        expect(mockSaveSlackWebhookUrl).toHaveBeenCalledWith(TEST_CONSTANTS.UPDATED_SLACK_WEBHOOK_URL);
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('should display validation error when an invalid GitHub host format is entered', async () => {
    // Mock validation error for invalid hostname
    mockSaveGitHubHost.mockRejectedValueOnce(new Error('Please enter a valid hostname'));

    // Render the options page
    render(<App />);

    // Wait for settings to load from storage
    await waitFor(
      () => {
        expect(mockGetGitHubHost).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );

    // Enter invalid GitHub host with special characters
    const githubHostInput = screen.getByLabelText(/GitHub Host/i);
    fireEvent.change(githubHostInput, { target: { value: 'invalid@host' } });

    // Wait for validation error to be displayed (the App component has a 500ms debounce)
    await waitFor(
      () => {
        expect(screen.getByText(/Please enter a valid hostname/i)).toBeInTheDocument();
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('should display validation error when an invalid Slack webhook URL format is entered', async () => {
    // Mock validation error for invalid webhook URL
    mockSaveSlackWebhookUrl.mockRejectedValueOnce(new Error('Please enter a valid Slack webhook URL'));

    // Render the options page
    render(<App />);

    // Wait for settings to load from storage
    await waitFor(
      () => {
        expect(mockGetSlackWebhookUrl).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );

    // Enter invalid Slack webhook URL that's not a URL
    const slackWebhookInput = screen.getByLabelText(/Slack Webhook URL/i);
    fireEvent.change(slackWebhookInput, { target: { value: 'not-a-url' } });

    // Wait for validation error to be displayed (the App component has a 500ms debounce)
    await waitFor(
      () => {
        expect(screen.getByText(/Please enter a valid Slack webhook URL/i)).toBeInTheDocument();
      },
      { timeout: STANDARD_TIMEOUT },
    );
  });

  it('should automatically clean GitHub host input by removing protocol and trailing slashes', async () => {
    // Render the options page
    render(<App />);

    // Wait for settings to load from storage
    await waitFor(
      () => {
        expect(mockGetGitHubHost).toHaveBeenCalled();
      },
      { timeout: STANDARD_TIMEOUT },
    );

    // Get the GitHub host input
    const githubHostInput = screen.getByLabelText(/GitHub Host/i);

    // Test with protocol
    fireEvent.change(githubHostInput, { target: { value: 'https://github.newcompany.com' } });
    expect(githubHostInput).toHaveValue('github.newcompany.com');

    // Test with trailing slash
    fireEvent.change(githubHostInput, { target: { value: 'github.newcompany.com/' } });
    expect(githubHostInput).toHaveValue('github.newcompany.com');

    // Test with both protocol and trailing slash
    fireEvent.change(githubHostInput, { target: { value: 'http://github.newcompany.com/' } });
    expect(githubHostInput).toHaveValue('github.newcompany.com');
  });

  it('should display error message but still render form when storage errors occur', async () => {
    // Mock storage errors for both settings
    mockGetGitHubHost.mockRejectedValueOnce(new Error('Storage error'));
    mockGetSlackWebhookUrl.mockRejectedValueOnce(new Error('Storage error'));

    // Render the options page
    render(<App />);

    // Verify error message is displayed for storage error
    await waitFor(
      () => {
        expect(screen.getByText(/Error loading settings/i)).toBeInTheDocument();
      },
      { timeout: STANDARD_TIMEOUT },
    );

    // Verify form is still rendered despite the error
    expect(screen.getByLabelText(/GitHub Host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Slack Webhook URL/i)).toBeInTheDocument();
  });
});
