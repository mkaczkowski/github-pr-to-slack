import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlack } from './useSlack';
import { chromeMock } from '../../../test/mocks/chrome';
import { getLastUsedWebhookName, getSlackWebhooks, storeLastUsedWebhookName } from '../../../utils/storage';

vi.mock('../../../utils/storage', () => ({
  getLastUsedWebhookName: vi.fn(),
  getSlackWebhooks: vi.fn(),
  storeLastUsedWebhookName: vi.fn(),
}));

vi.mock('../../../utils/chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../utils/errorHandler', () => ({
  withErrorHandling: (fn: any, options: any) => {
    return async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        if (options.setStatusMessage) {
          options.setStatusMessage({
            text: `${options.context || 'Error'}: ${(error as Error).message}`,
            type: 'error',
          });
        }
        if (options.logError) {
          options.logError(`${options.context || 'Error'}: ${(error as Error).message}`, error);
        }
        return { success: false, error: (error as Error).message };
      }
    };
  },
}));

describe('useSlack Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    global.chrome = chromeMock as unknown as typeof chrome;

    (getLastUsedWebhookName as any).mockResolvedValue('frontend');
    (getSlackWebhooks as any).mockResolvedValue([{ name: 'frontend', url: 'https://hooks.slack.com/services/A/B/C' }]);
    (storeLastUsedWebhookName as any).mockResolvedValue(undefined);
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useSlack());

    expect(result.current.isConfigured).toBe(true);
    expect(result.current.statusMessage).toEqual({ text: '', type: '' });
  });

  describe('checkSlackConfig', () => {
    it('sets isConfigured to true when Slack is configured', async () => {
      chromeMock.runtime.sendMessage.mockResolvedValue({
        configured: true,
        success: true,
      });

      const { result } = renderHook(() => useSlack());

      await act(async () => {
        const isConfigured = await result.current.checkSlackConfig();
        expect(isConfigured).toBe(true);
      });

      expect(result.current.isConfigured).toBe(true);
      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith({
        message: 'checkSlackConfig',
      });
    });

    it('sets isConfigured to false and shows warning when Slack is not configured', async () => {
      chromeMock.runtime.sendMessage.mockResolvedValue({
        configured: false,
        success: true,
      });

      const { result } = renderHook(() => useSlack());

      await act(async () => {
        const isConfigured = await result.current.checkSlackConfig();
        expect(isConfigured).toBe(false);
      });

      expect(result.current.isConfigured).toBe(false);
      expect(result.current.statusMessage).toEqual({
        text: 'Slack is not configured. Please go to extension options to set it up.',
        type: 'warning',
      });
    });

    it('handles errors during configuration check', async () => {
      chromeMock.runtime.sendMessage.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSlack());

      await act(async () => {
        const isConfigured = await result.current.checkSlackConfig();
        expect(isConfigured).toEqual({ success: false, error: 'Network error' });
      });

      expect(result.current.statusMessage.type).toBe('error');
      expect(result.current.statusMessage.text).toContain('Network error');
    });
  });

  describe('loadWebhooks', () => {
    it('returns webhooks from storage', async () => {
      const webhooks = [
        { name: 'frontend', url: 'https://hooks.slack.com/services/A/B/C' },
        { name: 'backend', url: 'https://hooks.slack.com/services/D/E/F' },
      ];
      (getSlackWebhooks as any).mockResolvedValue(webhooks);

      const { result } = renderHook(() => useSlack());

      let loaded;
      await act(async () => {
        loaded = await result.current.loadWebhooks();
      });

      expect(loaded).toEqual(webhooks);
    });

    it('returns an empty list and surfaces an error when storage throws', async () => {
      (getSlackWebhooks as any).mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useSlack());

      let loaded;
      await act(async () => {
        loaded = await result.current.loadWebhooks();
      });

      expect(loaded).toEqual([]);
      expect(result.current.statusMessage.type).toBe('error');
    });
  });

  describe('loadLastUsedWebhookName', () => {
    it('returns the stored webhook name', async () => {
      (getLastUsedWebhookName as any).mockResolvedValue('backend');

      const { result } = renderHook(() => useSlack());

      let name;
      await act(async () => {
        name = await result.current.loadLastUsedWebhookName();
      });

      expect(name).toBe('backend');
    });

    it('returns empty string on failure', async () => {
      (getLastUsedWebhookName as any).mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useSlack());

      let name;
      await act(async () => {
        name = await result.current.loadLastUsedWebhookName();
      });

      expect(name).toBe('');
    });
  });

  describe('sendToSlack', () => {
    it('sends message to Slack successfully', async () => {
      chromeMock.runtime.sendMessage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useSlack());

      let response;
      await act(async () => {
        response = await result.current.sendToSlack({
          webhookName: 'frontend',
          message: 'Test message',
        });
      });

      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith({
        message: 'sendToSlack',
        data: {
          webhookName: 'frontend',
          message: { text: 'Test message' },
        },
      });

      expect(response).toEqual({ success: true });
      expect(result.current.statusMessage).toEqual({
        text: 'Message sent to Slack successfully!',
        type: 'success',
      });
    });

    it('stores the webhook name after a successful send', async () => {
      chromeMock.runtime.sendMessage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useSlack());

      await act(async () => {
        await result.current.sendToSlack({
          webhookName: 'backend',
          message: 'Test message',
        });
      });

      expect(storeLastUsedWebhookName).toHaveBeenCalledWith('backend');
    });

    it('handles errors when sending to Slack', async () => {
      chromeMock.runtime.sendMessage.mockResolvedValue({
        success: false,
        error: 'Slack API error',
      });

      const { result } = renderHook(() => useSlack());

      let response;
      await act(async () => {
        response = await result.current.sendToSlack({
          webhookName: 'frontend',
          message: 'Test message',
        });
      });

      expect(response).toEqual({ success: false, error: 'Slack API error' });
      expect(result.current.statusMessage).toEqual({
        text: 'Error sending to Slack: Slack API error',
        type: 'error',
      });
      expect(storeLastUsedWebhookName).not.toHaveBeenCalled();
    });

    it('handles network errors when sending to Slack', async () => {
      chromeMock.runtime.sendMessage.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSlack());

      let response;
      await act(async () => {
        response = await result.current.sendToSlack({
          webhookName: 'frontend',
          message: 'Test message',
        });
      });

      expect(response).toEqual({ success: false, error: 'Network error' });
      expect(result.current.statusMessage.type).toBe('error');
      expect(result.current.statusMessage.text).toContain('Network error');
    });

    it('formats @mentions with <> when sending to Slack', async () => {
      chromeMock.runtime.sendMessage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useSlack());

      await act(async () => {
        await result.current.sendToSlack({
          webhookName: 'frontend',
          message: 'Please review @user1 and @user2',
        });
      });

      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith({
        message: 'sendToSlack',
        data: {
          webhookName: 'frontend',
          message: { text: 'Please review <@user1> and <@user2>' },
        },
      });
    });
  });

  describe('setStatusMessage', () => {
    it('updates status message state', () => {
      const { result } = renderHook(() => useSlack());

      act(() => {
        result.current.setStatusMessage({
          text: 'Test status message',
          type: 'info',
        });
      });

      expect(result.current.statusMessage).toEqual({
        text: 'Test status message',
        type: 'info',
      });
    });
  });
});
