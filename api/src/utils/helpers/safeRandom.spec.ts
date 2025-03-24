/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
