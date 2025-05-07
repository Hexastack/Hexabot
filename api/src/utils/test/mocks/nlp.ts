/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NLU } from '@/helper/types';
import { NlpCacheMap } from '@/nlp/schemas/types';

export const nlpEntitiesGreeting: NLU.ParseEntities = {
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

export const mockNlpEntitiesSetOne: NLU.ParseEntities = {
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
  ],
};

export const mockNlpEntitiesSetTwo: NLU.ParseEntities = {
  entities: [
    {
      entity: 'intent',
      value: 'greeting',
      confidence: 0.94,
    },
    {
      entity: 'firstname',
      value: 'doe',
      confidence: 0.33,
    },
  ],
};

export const mockNlpCacheMap: NlpCacheMap = new Map([
  [
    'intent',
    {
      id: '1',
      weight: 1,
      name: 'intent',
      values: [
        {
          id: '11',
          value: 'greeting',
          createdAt: new Date(),
          updatedAt: new Date(),
          doc: '',
          entity: '1',
          builtin: false,
          metadata: {},
          expressions: [],
        },
        {
          id: '12',
          value: 'affirmation',
          createdAt: new Date(),
          updatedAt: new Date(),
          doc: '',
          entity: '1',
          builtin: false,
          metadata: {},
          expressions: [],
        },
      ],
      lookups: ['trait'],
      builtin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  [
    'firstname',

    {
      id: '2',
      weight: 1,
      name: 'firstname',
      values: [
        {
          id: '21',
          value: 'jhon',
          createdAt: new Date(),
          updatedAt: new Date(),
          doc: '',
          entity: '2',
          builtin: false,
          metadata: {},
          expressions: [],
        },
        {
          id: '22',
          value: 'doe',
          createdAt: new Date(),
          updatedAt: new Date(),
          doc: '',
          entity: '2',
          builtin: false,
          metadata: {},
          expressions: [],
        },
      ],
      lookups: ['trait'],
      builtin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
]);
