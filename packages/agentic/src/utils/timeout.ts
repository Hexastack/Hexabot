/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

/**
 * Resolves after the specified duration; useful for retry delays.
 *
 * @param durationMs - Number of milliseconds to wait before resolving.
 * @returns A promise that resolves once the duration elapses.
 */
export const sleep = (durationMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

/**
 * Wraps a promise and rejects if it does not settle within the timeout.
 *
 * @param promise - Operation that may take longer than the allowed timeout.
 * @param timeoutMs - Maximum time in milliseconds to wait before rejecting.
 * @returns The result of the original promise when it resolves in time.
 * @throws Error when the timeout is exceeded.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs?: number,
): Promise<T> {
  if (!timeoutMs) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Step execution exceeded timeout of ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
