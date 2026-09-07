import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExtensionContextInvalidatedError, sendMessageToBackground } from './messaging';
import { chromeMock } from '../test/mocks/chrome';

vi.mock('./chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

const ASLEEP_ERROR = new Error('Could not establish connection. Receiving end does not exist.');

describe('sendMessageToBackground', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    global.chrome = chromeMock as unknown as typeof chrome;
    chromeMock.runtime.id = 'mock-extension-id';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the background response on the first attempt', async () => {
    chromeMock.runtime.sendMessage.mockResolvedValue({ success: true, configured: true });

    const response = await sendMessageToBackground({ message: 'checkSlackConfig' });

    expect(response).toEqual({ success: true, configured: true });
    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('should retry while the service worker is waking up', async () => {
    chromeMock.runtime.sendMessage
      .mockRejectedValueOnce(ASLEEP_ERROR)
      .mockRejectedValueOnce(ASLEEP_ERROR)
      .mockResolvedValue({ success: true });

    // Attach the assertion before advancing timers so the rejection is never unhandled.
    const assertion = expect(sendMessageToBackground({ message: 'openOptionsPage' })).resolves.toEqual({
      success: true,
    });
    await vi.runAllTimersAsync();
    await assertion;

    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(3);
  });

  it('should give up with a debuggable error when the worker never wakes', async () => {
    chromeMock.runtime.sendMessage.mockRejectedValue(ASLEEP_ERROR);

    // Attach the assertion before advancing timers so the rejection is never unhandled.
    const assertion = expect(sendMessageToBackground({ message: 'checkSlackConfig' })).rejects.toThrow(
      /Could not reach the extension background worker for "checkSlackConfig" after 4 attempts/,
    );
    await vi.runAllTimersAsync();
    await assertion;

    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(4);
  });

  it('should report an orphaned content script as ExtensionContextInvalidatedError', async () => {
    chromeMock.runtime.id = undefined as unknown as string;

    await expect(sendMessageToBackground({ message: 'checkSlackConfig' })).rejects.toBeInstanceOf(
      ExtensionContextInvalidatedError,
    );
    expect(chromeMock.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('should convert an "Extension context invalidated" throw into ExtensionContextInvalidatedError', async () => {
    chromeMock.runtime.sendMessage.mockRejectedValue(new Error('Extension context invalidated.'));

    await expect(sendMessageToBackground({ message: 'checkSlackConfig' })).rejects.toThrow(
      /Reload the page to reconnect/,
    );
    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('should surface unrelated errors unchanged and not retry them', async () => {
    chromeMock.runtime.sendMessage.mockRejectedValue(new Error('Network error'));

    await expect(sendMessageToBackground({ message: 'checkSlackConfig' })).rejects.toThrow('Network error');
    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });
});
