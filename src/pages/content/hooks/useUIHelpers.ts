import { useEffect, useRef } from 'react';
import { debug } from '../../../utils/chrome-polyfill';

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

  const openOptions = (): void => {
    chrome.runtime.openOptionsPage();
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
