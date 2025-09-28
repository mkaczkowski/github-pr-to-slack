import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatSlackMessage, sendToSlack } from './slack';
import { getSlackWebhookUrl } from './storage';
import { chromeMock } from '../test/mocks/chrome';

// Mock the storage module
vi.mock('./storage', () => ({
  getSlackWebhookUrl: vi.fn(),
}));

// Mock the chrome-polyfill module
vi.mock('./chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Slack Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock for getSlackWebhookUrl
    (getSlackWebhookUrl as any).mockResolvedValue(
      'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatSlackMessage', () => {
    it('should format basic PR info correctly', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('*Test PR Title*');
      expect(message.text).toContain('https://github.com/user/repo/pull/123');
    });

    it('should include reviewers when provided', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        reviewers: ['user1', 'user2'],
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('assigned: <@user1>, <@user2>');
    });

    it('should include the author line before the assigned line when provided', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        author: 'author.name',
        reviewers: ['reviewer'],
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('author: <@authorname>');
      expect(message.text).toContain('assigned: <@reviewer>');
      expect(message.text.indexOf('author:')).toBeLessThan(message.text.indexOf('assigned:'));
    });

    it('should sanitize reviewer names', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        reviewers: ['user.name', 'user@email.com'],
      };

      const message = formatSlackMessage(prInfo);

      // Should strip special characters
      expect(message.text).toContain('<@username>');
      expect(message.text).toContain('<@useremailcom>');
    });

    it('should sanitize author name when provided', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        author: 'author.email@example.com',
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('author: <@authoremailexamplecom>');
    });

    it('should include lines of code changes when provided', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        loc: ['+100', '-50'],
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('(+100, -50)');
    });

    it('should include custom message when provided', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
      };

      const customMessage = 'Please review this PR';
      const message = formatSlackMessage(prInfo, customMessage);

      expect(message.text).toContain('Please review this PR');
    });
  });

  describe('sendToSlack', () => {
    it('should throw an error if webhook URL is not configured', async () => {
      // Mock getSlackWebhookUrl to return empty string
      (getSlackWebhookUrl as any).mockResolvedValue('');

      const message = { text: 'Test message' };
      const result = await sendToSlack('#general', message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack webhook URL not configured');
    });

    it('should send message to Slack with correct payload', async () => {
      // Mock successful fetch response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const message = { text: 'Test message' };
      const result = await sendToSlack('#general', message);

      // Check that fetch was called with correct arguments
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            text: 'Test message',
            channel: '#general',
          }),
        }),
      );

      expect(result.success).toBe(true);
    });

    it('should handle Slack API errors', async () => {
      // Mock failed fetch response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'invalid_payload',
      });

      const message = { text: 'Test message' };
      const result = await sendToSlack('#general', message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack API error: 400 invalid_payload');
    });

    it('should handle network errors', async () => {
      // Mock network error
      const networkError = new TypeError('Failed to fetch');
      mockFetch.mockRejectedValue(networkError);

      const message = { text: 'Test message' };
      const result = await sendToSlack('#general', message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error: could not connect to Slack');
    });

    it('should handle other fetch errors', async () => {
      // Mock other error
      const otherError = new Error('Some other error');
      mockFetch.mockRejectedValue(otherError);

      const message = { text: 'Test message' };
      const result = await sendToSlack('#general', message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Some other error');
    });
  });
});
