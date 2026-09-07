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

const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

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

/**
 * Only these two errors are safe to retry. Chrome raises them when no receiver
 * existed at dispatch time, which means the request was never handed to a
 * handler and replaying it cannot repeat a side effect.
 *
 * Do not add "The message port closed before a response was received" here.
 * That one means the worker accepted the request and died before answering, so
 * a `sendToSlack` retry would post the message to Slack a second time.
 */
const isServiceWorkerAsleepError = (message: string): boolean =>
  message.includes('Receiving end does not exist') || message.includes('Could not establish connection');

const isContextInvalidatedError = (message: string): boolean => message.includes('Extension context invalidated');

/** True while this context can still reach the extension; `chrome.runtime.id` is cleared when it cannot. */
const hasLiveExtensionContext = (): boolean => !!chrome.runtime?.id;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a request to the background service worker, waking it if needed.
 *
 * Always resolves with a response or throws; it never hands back `undefined`.
 *
 * @throws ExtensionContextInvalidatedError when the page outlived the extension version that injected it.
 * @throws Error when the worker stays unreachable, has no handler for the request, or fails for any other reason.
 */
export const sendMessageToBackground = async (request: BackgroundRequest): Promise<BackgroundResponse> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (!hasLiveExtensionContext()) {
      throw new ExtensionContextInvalidatedError(request.message);
    }

    let response: BackgroundResponse | undefined;

    try {
      response = (await chrome.runtime.sendMessage(request)) as BackgroundResponse | undefined;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isContextInvalidatedError(lastError.message) || !hasLiveExtensionContext()) {
        throw new ExtensionContextInvalidatedError(request.message);
      }

      // Anything other than a sleeping worker is a real failure; report it unchanged.
      if (!isServiceWorkerAsleepError(lastError.message)) {
        throw lastError;
      }

      if (attempt === MAX_ATTEMPTS - 1) {
        break;
      }

      const retryDelayMs = RETRY_DELAYS_MS[attempt];
      debug.log('Messaging', 'Background worker unreachable, retrying', {
        request: request.message,
        attempt: attempt + 1,
        retryDelayMs,
      });
      await delay(retryDelayMs);
      continue;
    }

    // The worker was reachable but no handler matched, so nothing was done with
    // the request. Retrying cannot help: the request name and the worker's
    // routing have drifted apart.
    if (response === undefined) {
      throw new Error(`The background worker has no handler for "${request.message}", so it sent no response.`);
    }

    return response;
  }

  throw new Error(
    `Could not reach the extension background worker for "${request.message}" after ` +
      `${MAX_ATTEMPTS} attempts: ${lastError?.message ?? 'unknown error'}. ` +
      'Reload the page and try again.',
  );
};
