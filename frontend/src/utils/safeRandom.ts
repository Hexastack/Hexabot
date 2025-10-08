/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

/**
 * Return a cryptographically secure random value between 0 and 1
 *
 * @returns A cryptographically secure random value between 0 and 1
 */
export const getRandom = (): number =>
  window.crypto.getRandomValues(new Uint32Array(1))[0] * Math.pow(2, -32);
