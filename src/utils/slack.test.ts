import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatSlackMessage, sendToSlack } from './slack';
import { getWebhookByName } from './storage';

vi.mock('./storage', () => ({
  getWebhookByName: vi.fn(),
}));

vi.mock('./chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Slack Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getWebhookByName as any).mockResolvedValue({
      name: 'frontend',
      url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatSlackMessage', () => {
    it('formats basic PR info correctly', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('*Test PR Title*');
      expect(message.text).toContain('https://github.com/user/repo/pull/123');
    });

    it('includes reviewers when provided', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        reviewers: ['user1', 'user2'],
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('assigned: <@user1>, <@user2>');
    });

    it('includes the author line before the assigned line when provided', () => {
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

    it('sanitizes reviewer names', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        reviewers: ['user.name', 'user@email.com'],
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('<@username>');
      expect(message.text).toContain('<@useremailcom>');
    });

    it('sanitizes author name when provided', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        author: 'author.email@example.com',
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('author: <@authoremailexamplecom>');
    });

    it('includes lines of code changes when provided', () => {
      const prInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        loc: ['+100', '-50'],
      };

      const message = formatSlackMessage(prInfo);

      expect(message.text).toContain('(+100, -50)');
    });

    it('includes custom message when provided', () => {
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
    it('returns an error if the webhook name is not known', async () => {
      (getWebhookByName as any).mockResolvedValue(undefined);

      const message = { text: 'Test message' };
      const result = await sendToSlack('missing', message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('posts the message directly to the webhook URL without a channel field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const message = { text: 'Test message' };
      const result = await sendToSlack('frontend', message);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'Test message' }),
        }),
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).not.toHaveProperty('channel');

      expect(result.success).toBe(true);
    });

    it('handles Slack API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'invalid_payload',
      });

      const message = { text: 'Test message' };
      const result = await sendToSlack('frontend', message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack API error: 400 invalid_payload');
    });

    it('handles network errors', async () => {
      const networkError = new TypeError('Failed to fetch');
      mockFetch.mockRejectedValue(networkError);

      const message = { text: 'Test message' };
      const result = await sendToSlack('frontend', message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error: could not connect to Slack');
    });

    it('handles other fetch errors', async () => {
      const otherError = new Error('Some other error');
      mockFetch.mockRejectedValue(otherError);

      const message = { text: 'Test message' };
      const result = await sendToSlack('frontend', message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Some other error');
    });
  });
});
