/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { getRandomElement } from './safeRandom';

describe('safeRandom', () => {
  describe('getRandomElement', () => {
    it('should get a random message', () => {
      const messages = [
        'Hello, this is Nour',
        'Oh ! How are you ?',
        "Hmmm that's cool !",
        'Corona virus',
        'God bless you',
      ];
      const result = getRandomElement(messages);
      expect(messages).toContain(result);
    });

    it('should return undefined when trying to get a random message from an empty array', () => {
      const result = getRandomElement([]);
      expect(result).toBe(undefined);
    });
  });
});
