/**
 * Typed messaging between the content script and the background service worker.
 *
 * An MV3 service worker is terminated after a short idle period. Chrome normally
 * wakes it when a message arrives, but the first `sendMessage` after termination
 * can still fail with "Could not establish connection. Receiving end does not
 * exist." while the worker is starting up, so connection failures are retried.
 *
 * A content script left over from a previous extension version can never reach
 * the worker again. That case is detected and reported as a distinct error so
 * the UI can tell the user to reload the page instead of showing a raw Chrome
 * error string.
 */

import { debug } from './chrome-polyfill';

export interface SlackMessagePayload {
  text: string;
}

export interface CheckSlackConfigRequest {
  message: 'checkSlackConfig';
}

export interface SendToSlackRequest {
  message: 'sendToSlack';
  data: {
    channel: string;
    message: SlackMessagePayload;
  };
}

export interface OpenOptionsPageRequest {
  message: 'openOptionsPage';
}

export type BackgroundRequest = CheckSlackConfigRequest | SendToSlackRequest | OpenOptionsPageRequest;

export interface BackgroundResponse {
  success: boolean;
  error?: string;
  configured?: boolean;
  message?: string;
}

/** Delays before each retry, so the whole sequence stays well under a second. */
const RETRY_DELAYS_MS = [50, 150, 400];

/** Raised when the page holds a content script from a previous extension version. */
export class ExtensionContextInvalidatedError extends Error {
  constructor(requestName: string) {
    super(
      `The extension was reloaded or updated while this page was open, so "${requestName}" could not be delivered. ` +
        'Reload the page to reconnect.',
    );
    this.name = 'ExtensionContextInvalidatedError';
  }
}

const isServiceWorkerAsleepError = (message: string): boolean =>
  message.includes('Receiving end does not exist') || message.includes('Could not establish connection');

const isContextInvalidatedError = (message: string): boolean => message.includes('Extension context invalidated');

/** True while this context can still reach the extension; `chrome.runtime.id` is cleared when it cannot. */
const hasLiveExtensionContext = (): boolean => !!chrome.runtime?.id;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a request to the background service worker, waking it if needed.
 *
 * @throws ExtensionContextInvalidatedError when the page outlived the extension version that injected it.
 * @throws Error when the worker stays unreachable, or with the original failure for any other error.
 */
export const sendMessageToBackground = async <Response extends BackgroundResponse>(
  request: BackgroundRequest,
): Promise<Response> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (!hasLiveExtensionContext()) {
      throw new ExtensionContextInvalidatedError(request.message);
    }

    try {
      return (await chrome.runtime.sendMessage(request)) as Response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isContextInvalidatedError(lastError.message) || !hasLiveExtensionContext()) {
        throw new ExtensionContextInvalidatedError(request.message);
      }

      // Anything other than a sleeping worker is a real failure; report it unchanged.
      if (!isServiceWorkerAsleepError(lastError.message)) {
        throw lastError;
      }

      const retryDelayMs = RETRY_DELAYS_MS[attempt];
      if (retryDelayMs === undefined) {
        break;
      }

      debug.log('Messaging', 'Background worker unreachable, retrying', {
        request: request.message,
        attempt: attempt + 1,
        retryDelayMs,
      });
      await delay(retryDelayMs);
    }
  }

  throw new Error(
    `Could not reach the extension background worker for "${request.message}" after ` +
      `${RETRY_DELAYS_MS.length + 1} attempts: ${lastError?.message ?? 'unknown error'}. ` +
      'Reload the page and try again.',
  );
};
