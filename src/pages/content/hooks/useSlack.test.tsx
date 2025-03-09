import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlack } from './useSlack';
import { chromeMock } from '../../../test/mocks/chrome';
import { getStoredChannel, storeChannel } from '../../../utils/storage';

// Mock the storage module
vi.mock('../../../utils/storage', () => ({
  getStoredChannel: vi.fn(),
  storeChannel: vi.fn(),
}));

// Mock the chrome-polyfill module
vi.mock('../../../utils/chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the errorHandler module
vi.mock('../../../utils/errorHandler', () => ({
  withErrorHandling: (fn: any, options: any) => {
    // Simple implementation that just calls the function and handles errors
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

    // Replace global chrome with our mock
    global.chrome = chromeMock as unknown as typeof chrome;

    // Default mock for getStoredChannel
    (getStoredChannel as any).mockResolvedValue('#general');

    // Default mock for storeChannel
    (storeChannel as any).mockResolvedValue(undefined);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSlack());

    expect(result.current.isConfigured).toBe(true);
    expect(result.current.statusMessage).toEqual({ text: '', type: '' });
  });

  describe('checkSlackConfig', () => {
    it('should set isConfigured to true when Slack is configured', async () => {
      // Mock chrome.runtime.sendMessage to return configured: true
      chromeMock.runtime.sendMessage.mockResolvedValue({
        configured: true,
        success: true,
      });

      const { result } = renderHook(() => useSlack());

      // Call checkSlackConfig
      await act(async () => {
        const isConfigured = await result.current.checkSlackConfig();
        expect(isConfigured).toBe(true);
      });

      // Verify isConfigured state
      expect(result.current.isConfigured).toBe(true);

      // Verify chrome.runtime.sendMessage was called correctly
      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith({
        message: 'checkSlackConfig',
      });
    });

    it('should set isConfigured to false and show warning when Slack is not configured', async () => {
      // Mock chrome.runtime.sendMessage to return configured: false
      chromeMock.runtime.sendMessage.mockResolvedValue({
        configured: false,
        success: true,
        message: 'Slack is not configured. Please go to extension options to set it up.',
      });

      const { result } = renderHook(() => useSlack());

      // Call checkSlackConfig
      await act(async () => {
        const isConfigured = await result.current.checkSlackConfig();
        expect(isConfigured).toBe(false);
      });

      // Verify isConfigured state
      expect(result.current.isConfigured).toBe(false);

      // Verify statusMessage state
      expect(result.current.statusMessage).toEqual({
        text: 'Slack is not configured. Please go to extension options to set it up.',
        type: 'warning',
      });
    });

    it('should handle errors during configuration check', async () => {
      // Mock chrome.runtime.sendMessage to throw an error
      chromeMock.runtime.sendMessage.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSlack());

      // Call checkSlackConfig
      await act(async () => {
        const isConfigured = await result.current.checkSlackConfig();
        expect(isConfigured).toEqual({ success: false, error: 'Network error' });
      });

      // Verify statusMessage state contains error
      expect(result.current.statusMessage.type).toBe('error');
      expect(result.current.statusMessage.text).toContain('Network error');
    });
  });

  describe('loadStoredChannel', () => {
    it('should load stored channel from storage', async () => {
      // Mock getStoredChannel to return a channel
      (getStoredChannel as any).mockResolvedValue('#testing');

      const { result } = renderHook(() => useSlack());

      // Call loadStoredChannel
      let channel;
      await act(async () => {
        channel = await result.current.loadStoredChannel();
      });

      // Verify getStoredChannel was called
      expect(getStoredChannel).toHaveBeenCalled();

      // Verify the returned channel
      expect(channel).toBe('#testing');
    });

    it('should handle errors when loading stored channel', async () => {
      // Mock getStoredChannel to throw an error
      (getStoredChannel as any).mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useSlack());

      // Call loadStoredChannel
      let response;
      await act(async () => {
        response = await result.current.loadStoredChannel();
      });

      // Verify error handling
      expect(response).toEqual({ success: false, error: 'Storage error' });

      // Verify statusMessage state contains error
      expect(result.current.statusMessage.type).toBe('error');
      expect(result.current.statusMessage.text).toContain('Storage error');
    });
  });

  describe('sendToSlack', () => {
    it('should send message to Slack successfully', async () => {
      // Mock chrome.runtime.sendMessage to return success
      chromeMock.runtime.sendMessage.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useSlack());

      // Call sendToSlack
      let response;
      await act(async () => {
        response = await result.current.sendToSlack({
          channel: '#general',
          message: 'Test message',
        });
      });

      // Verify chrome.runtime.sendMessage was called correctly
      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith({
        message: 'sendToSlack',
        data: {
          channel: '#general',
          message: {
            text: 'Test message',
          },
        },
      });

      // Verify the response
      expect(response).toEqual({ success: true });

      // Verify statusMessage state shows success
      expect(result.current.statusMessage).toEqual({
        text: 'Message sent to Slack successfully!',
        type: 'success',
      });
    });

    it('should store the channel after successful send', async () => {
      // Mock chrome.runtime.sendMessage to return success
      chromeMock.runtime.sendMessage.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useSlack());

      // Call sendToSlack
      await act(async () => {
        await result.current.sendToSlack({
          channel: '#testing',
          message: 'Test message',
        });
      });

      // Verify storeChannel was called with the correct channel
      expect(storeChannel).toHaveBeenCalledWith('#testing');
    });

    it('should handle errors when sending to Slack', async () => {
      // Mock chrome.runtime.sendMessage to return an error
      chromeMock.runtime.sendMessage.mockResolvedValue({
        success: false,
        error: 'Slack API error',
      });

      const { result } = renderHook(() => useSlack());

      // Call sendToSlack
      let response;
      await act(async () => {
        response = await result.current.sendToSlack({
          channel: '#general',
          message: 'Test message',
        });
      });

      // Verify the response
      expect(response).toEqual({
        success: false,
        error: 'Slack API error',
      });

      // Verify statusMessage state shows error
      expect(result.current.statusMessage).toEqual({
        text: 'Error sending to Slack: Slack API error',
        type: 'error',
      });

      // Verify storeChannel was not called
      expect(storeChannel).not.toHaveBeenCalled();
    });

    it('should handle network errors when sending to Slack', async () => {
      // Mock chrome.runtime.sendMessage to throw an error
      chromeMock.runtime.sendMessage.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSlack());

      // Call sendToSlack
      let response;
      await act(async () => {
        response = await result.current.sendToSlack({
          channel: '#general',
          message: 'Test message',
        });
      });

      // Verify error handling
      expect(response).toEqual({ success: false, error: 'Network error' });

      // Verify statusMessage state contains error
      expect(result.current.statusMessage.type).toBe('error');
      expect(result.current.statusMessage.text).toContain('Network error');
    });

    it('should format @mentions with <> when sending to Slack', async () => {
      // Mock chrome.runtime.sendMessage to return success
      chromeMock.runtime.sendMessage.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useSlack());

      // Call sendToSlack with a message containing @mentions
      await act(async () => {
        await result.current.sendToSlack({
          channel: '#general',
          message: 'Please review @user1 and @user2',
        });
      });

      // Verify chrome.runtime.sendMessage was called with properly formatted mentions
      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith({
        message: 'sendToSlack',
        data: {
          channel: '#general',
          message: {
            text: 'Please review <@user1> and <@user2>',
          },
        },
      });
    });
  });

  describe('setStatusMessage', () => {
    it('should update status message state', () => {
      const { result } = renderHook(() => useSlack());

      // Call setStatusMessage
      act(() => {
        result.current.setStatusMessage({
          text: 'Test status message',
          type: 'info',
        });
      });

      // Verify statusMessage state
      expect(result.current.statusMessage).toEqual({
        text: 'Test status message',
        type: 'info',
      });
    });
  });
});
