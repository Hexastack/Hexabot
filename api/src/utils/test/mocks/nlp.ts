/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
