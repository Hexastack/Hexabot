/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import crypto from 'crypto';

/**
 * Return a cryptographically secure random value between 0 and 1
 *
 * @returns A cryptographically secure random value between 0 and 1
 */
export const getRandom = (): number =>
  crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

/**
 * Return a randomly picked item of the array
 *
 * @param array - Array of any type
 *
 * @returns A random item from the array
 */
export const getRandomElement = <T>(array: T[]): T => {
  return Array.isArray(array)
    ? array[Math.floor(getRandom() * array.length)]
    : array;
};
