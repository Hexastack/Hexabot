/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
