/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NlpEntityFull } from '@/nlp/schemas/nlp-entity.schema';
import { NlpSampleFull } from '@/nlp/schemas/nlp-sample.schema';
import { NlpSampleState } from '@/nlp/schemas/types';

export const modelInstance = {
  id: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const baseNlpValue = {
  ...modelInstance,
  expressions: [],
  builtin: true,
};

export const baseNlpEntity = {
  ...modelInstance,
  doc: '',
  builtin: true,
};

export const baseLanguage = {
  ...modelInstance,
  title: 'English',
  code: 'en',
  isDefault: true,
};

export const entitiesMock: NlpEntityFull[] = [
  {
    ...baseNlpEntity,
    id: 'entity-1',
    name: 'intent',
    lookups: ['trait'],
    values: [
      {
        ...baseNlpValue,
        id: 'value-1',
        entity: 'entity-1',
        value: 'greeting',
      },
      {
        ...baseNlpValue,
        id: 'value-2',
        entity: 'entity-1',
        value: 'order',
      },
    ],
  },
  {
    ...baseNlpEntity,
    id: 'entity-2',
    name: 'product',
    lookups: ['keywords'],
    doc: '',
    values: [
      {
        ...baseNlpValue,
        id: 'value-3',
        entity: 'entity-2',
        value: 'pizza',
        expressions: ['piza', 'pizzza'],
      },
      {
        ...baseNlpValue,
        id: 'value-4',
        entity: 'entity-2',
        value: 'sandwich',
      },
    ],
  },
];

export const samplesMock: NlpSampleFull[] = [
  {
    ...modelInstance,
    id: 'sample-1',
    text: 'Hello',
    entities: [
      {
        ...baseNlpEntity,
        sample: 'sample-1',
        entity: 'entity-1',
        value: 'value-1',
      },
    ],
    trained: false,
    type: NlpSampleState.train,
    language: baseLanguage,
  },
  {
    ...modelInstance,
    id: 'sample-2',
    text: 'i want to order a pizza',
    entities: [
      {
        ...baseNlpEntity,
        sample: 'sample-2',
        entity: 'entity-1',
        value: 'value-2',
      },
      {
        ...baseNlpEntity,
        sample: 'sample-2',
        entity: 'entity-2',
        value: 'value-3',
        start: 19,
        end: 23,
      },
    ],
    trained: false,
    type: NlpSampleState.train,
    language: baseLanguage,
  },
];
