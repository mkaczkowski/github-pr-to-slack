import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIHelpers } from './useUIHelpers';
import { chromeMock } from '../../../test/mocks/chrome';

// Mock the chrome-polyfill module
vi.mock('../../../utils/chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

describe('useUIHelpers Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Replace global chrome with our mock
    global.chrome = chromeMock as unknown as typeof chrome;

    // Add openOptionsPage to runtime mock
    chromeMock.runtime.openOptionsPage = vi.fn();

    // Reset document event listeners
    vi.spyOn(document, 'addEventListener').mockClear();
    vi.spyOn(document, 'removeEventListener').mockClear();

    // Reset navigator.clipboard
    (navigator.clipboard.writeText as any).mockReset();
  });

  describe('popupRef and click outside handling', () => {
    it('should add event listener for mousedown when onClose is provided', () => {
      const onClose = vi.fn();

      renderHook(() => useUIHelpers(onClose));

      expect(document.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });

    it('should not add event listener when onClose is not provided', () => {
      renderHook(() => useUIHelpers());

      expect(document.addEventListener).not.toHaveBeenCalled();
    });

    it('should remove event listener on unmount', () => {
      const onClose = vi.fn();

      const { unmount } = renderHook(() => useUIHelpers(onClose));
      unmount();

      expect(document.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });

    it('should call onClose when clicking outside the popup', () => {
      const onClose = vi.fn();

      // Create a mock event and elements
      const mockEvent = { target: document.createElement('div') } as unknown as MouseEvent;
      const mockPopupRef = { current: document.createElement('div') };

      // Mock contains to return false (click outside)
      vi.spyOn(mockPopupRef.current, 'contains').mockReturnValue(false);

      // Render the hook
      const { result } = renderHook(() => useUIHelpers(onClose));

      // Manually assign the popupRef
      Object.defineProperty(result.current.popupRef, 'current', {
        value: mockPopupRef.current,
        writable: true,
      });

      // Get the event listener function
      const eventListener = (document.addEventListener as any).mock.calls[0][1];

      // Trigger the event listener with act
      act(() => {
        eventListener(mockEvent);
      });

      // Verify onClose was called
      expect(onClose).toHaveBeenCalled();
    });

    it('should not call onClose when clicking inside the popup', () => {
      const onClose = vi.fn();

      // Create a mock event and elements
      const mockEvent = { target: document.createElement('div') } as unknown as MouseEvent;
      const mockPopupRef = { current: document.createElement('div') };

      // Mock contains to return true (click inside)
      vi.spyOn(mockPopupRef.current, 'contains').mockReturnValue(true);

      // Render the hook
      const { result } = renderHook(() => useUIHelpers(onClose));

      // Get the event listener function
      const eventListener = (document.addEventListener as any).mock.calls[0][1];

      // Manually set the popupRef
      (result.current.popupRef as any) = mockPopupRef;

      // Trigger the event listener
      eventListener(mockEvent);

      // Verify onClose was not called
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard', async () => {
      // Mock successful clipboard write
      (navigator.clipboard.writeText as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUIHelpers());

      // Call copyToClipboard
      const success = await result.current.copyToClipboard('Test text');

      // Verify clipboard.writeText was called with the correct text
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test text');

      // Verify the function returned true (success)
      expect(success).toBe(true);
    });

    it('should return false for empty text', async () => {
      const { result } = renderHook(() => useUIHelpers());

      // Call copyToClipboard with empty text
      const success = await result.current.copyToClipboard('');

      // Verify clipboard.writeText was not called
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();

      // Verify the function returned false
      expect(success).toBe(false);
    });

    it('should handle clipboard errors', async () => {
      // Mock clipboard error
      (navigator.clipboard.writeText as any).mockRejectedValue(new Error('Clipboard error'));

      const { result } = renderHook(() => useUIHelpers());

      // Call copyToClipboard
      const success = await result.current.copyToClipboard('Test text');

      // Verify the function returned false
      expect(success).toBe(false);
    });
  });

  describe('openOptions', () => {
    it('should ask the background worker to open the options page', async () => {
      chromeMock.runtime.sendMessage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useUIHelpers());

      await result.current.openOptions();

      // chrome.runtime.openOptionsPage does not exist in content scripts,
      // so the request has to go through the background worker.
      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith({ message: 'openOptionsPage' });
      expect(chromeMock.runtime.openOptionsPage).not.toHaveBeenCalled();
    });

    it('should throw when the background worker reports a failure', async () => {
      chromeMock.runtime.sendMessage.mockResolvedValue({ success: false, error: 'Could not open options page' });

      const { result } = renderHook(() => useUIHelpers());

      await expect(result.current.openOptions()).rejects.toThrow('Could not open options page');
    });

    it('should throw when the background worker sends no response', async () => {
      chromeMock.runtime.sendMessage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useUIHelpers());

      await expect(result.current.openOptions()).rejects.toThrow('the background worker sent no response');
    });
  });

  describe('handleKeyDown', () => {
    it('should call onSubmit when Enter key is pressed without Shift', () => {
      const onSubmit = vi.fn();
      const onEscape = vi.fn();
      const mockEvent = {
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const { result } = renderHook(() => useUIHelpers());

      // Call handleKeyDown
      result.current.handleKeyDown(mockEvent, onSubmit, onEscape);

      // Verify preventDefault and onSubmit were called
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(onSubmit).toHaveBeenCalled();
      expect(onEscape).not.toHaveBeenCalled();
    });

    it('should not call onSubmit when Enter key is pressed with Shift', () => {
      const onSubmit = vi.fn();
      const onEscape = vi.fn();
      const mockEvent = {
        key: 'Enter',
        shiftKey: true,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const { result } = renderHook(() => useUIHelpers());

      // Call handleKeyDown
      result.current.handleKeyDown(mockEvent, onSubmit, onEscape);

      // Verify onSubmit was not called
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onEscape).not.toHaveBeenCalled();
    });

    it('should call onEscape when Escape key is pressed', () => {
      const onSubmit = vi.fn();
      const onEscape = vi.fn();
      const mockEvent = {
        key: 'Escape',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const { result } = renderHook(() => useUIHelpers());

      // Call handleKeyDown
      result.current.handleKeyDown(mockEvent, onSubmit, onEscape);

      // Verify preventDefault and onEscape were called
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onEscape).toHaveBeenCalled();
    });

    it('should not call onEscape when Escape key is pressed but onEscape is not provided', () => {
      const onSubmit = vi.fn();
      const mockEvent = {
        key: 'Escape',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const { result } = renderHook(() => useUIHelpers());

      // Call handleKeyDown without onEscape
      result.current.handleKeyDown(mockEvent, onSubmit);

      // Verify preventDefault was not called
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should not call any callback for other keys', () => {
      const onSubmit = vi.fn();
      const onEscape = vi.fn();
      const mockEvent = {
        key: 'A',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const { result } = renderHook(() => useUIHelpers());

      // Call handleKeyDown
      result.current.handleKeyDown(mockEvent, onSubmit, onEscape);

      // Verify no callbacks were called
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onEscape).not.toHaveBeenCalled();
    });
  });
});
