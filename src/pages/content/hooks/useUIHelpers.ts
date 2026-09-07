import { useEffect, useRef } from 'react';
import { debug } from '../../../utils/chrome-polyfill';
import { BackgroundResponse, sendMessageToBackground } from '../../../utils/messaging';

export const useUIHelpers = (onClose?: () => void) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onClose) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (!text) {
        debug.error('UI', 'Cannot copy empty text to clipboard');
        return false;
      }

      await navigator.clipboard.writeText(text);
      debug.log('UI', 'Copied to clipboard:', text.substring(0, 50) + '...');
      return true;
    } catch (error) {
      debug.error('UI', 'Error copying to clipboard', error);
      return false;
    }
  };

  // chrome.runtime.openOptionsPage is not exposed to content scripts, so the
  // background service worker has to open the page on our behalf.
  const openOptions = async (): Promise<void> => {
    const response = await sendMessageToBackground<BackgroundResponse>({ message: 'openOptionsPage' });

    if (!response?.success) {
      throw new Error(
        `Could not open the extension options page: ${response?.error || 'the background worker sent no response'}`,
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, onSubmit?: () => void, onEscape?: () => void): void => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }

    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
    }
  };

  return {
    popupRef,
    copyToClipboard,
    openOptions,
    handleKeyDown,
  };
};
