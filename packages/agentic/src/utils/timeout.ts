/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { getAbortReason, throwIfAborted } from '../errors';

/**
 * Resolves after the specified duration; useful for retry delays.
 *
 * @param durationMs - Number of milliseconds to wait before resolving.
 * @param signal - Optional signal used to cancel the wait.
 * @returns A promise that resolves once the duration elapses.
 */
export const sleep = (
  durationMs: number,
  signal?: AbortSignal,
): Promise<void> => {
  if (!signal) {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
  }

  throwIfAborted(signal);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, durationMs);
    const onAbort = () => {
      clearTimeout(timer);
      reject(getAbortReason(signal));
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
};

/**
 * Wraps a promise and rejects if it does not settle within the timeout.
 *
 * @param promise - Operation that may take longer than the allowed timeout.
 * @param timeoutMs - Maximum time in milliseconds to wait before rejecting.
 * @param signal - Optional signal used to cancel the operation.
 * @returns The result of the original promise when it resolves in time.
 * @throws Error when the timeout is exceeded.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs?: number,
  signal?: AbortSignal,
): Promise<T> {
  if (!timeoutMs && !signal) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = timeoutMs
      ? setTimeout(() => {
          settled = true;
          signal?.removeEventListener('abort', onAbort);
          reject(
            new Error(`Step execution exceeded timeout of ${timeoutMs}ms`),
          );
        }, timeoutMs)
      : undefined;
    const onAbort = () => {
      if (settled) {
        return;
      }

      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      reject(getAbortReason(signal as AbortSignal));
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();

        return;
      }

      signal.addEventListener('abort', onAbort, { once: true });
    }

    promise.then(
      (value) => {
        if (settled) {
          return;
        }

        settled = true;
        if (timer) {
          clearTimeout(timer);
        }
        signal?.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        if (settled) {
          return;
        }

        settled = true;
        if (timer) {
          clearTimeout(timer);
        }
        signal?.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}
