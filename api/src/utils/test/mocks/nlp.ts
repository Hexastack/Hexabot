/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NLU } from '@/helper/types';

export const mockNlpGreetingNameEntities: NLU.ScoredEntities = {
  entities: [
    {
      entity: 'intent',
      value: 'greeting',
      confidence: 0.999,
      score: 0.999,
    },
    {
      entity: 'firstname',
      value: 'jhon',
      confidence: 0.5,
      score: 0.425,
    },
  ],
};

export const mockNlpGreetingFullNameEntities: NLU.ParseEntities = {
  entities: [
    {
      entity: 'intent',
      value: 'greeting',
      confidence: 0.999,
    },
    {
      entity: 'firstname',
      value: 'jhon',
      confidence: 0.5,
    },
    {
      entity: 'lastname',
      value: 'doe',
      confidence: 0.5,
    },
  ],
};

export const mockNlpFirstNameEntities: NLU.ParseEntities = {
  entities: [
    {
      entity: 'firstname',
      value: 'jhonny',
      canonicalValue: 'jhon',
      confidence: 0.75,
    },
  ],
};
