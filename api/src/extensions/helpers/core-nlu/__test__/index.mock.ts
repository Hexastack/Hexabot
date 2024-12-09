/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NLU } from '@/helper/types';

import { NlpParseResultType, RasaNlu } from '../types';

export const nlpEmptyFormated: RasaNlu.Dataset = {
  common_examples: [],
  regex_features: [],
  lookup_tables: [
    {
      name: 'intent',
      elements: ['greeting', 'order'],
    },
    {
      name: 'product',
      elements: ['pizza', 'sandwich'],
    },
    {
      elements: ['en', 'fr'],
      name: 'language',
    },
  ],
  entity_synonyms: [
    {
      value: 'pizza',
      synonyms: ['piza', 'pizzza'],
    },
  ],
};

export const nlpFormatted: RasaNlu.Dataset = {
  common_examples: [
    {
      text: 'Hello',
      intent: 'greeting',
      entities: [
        {
          entity: 'language',
          value: 'en',
        },
      ],
    },
    {
      text: 'i want to order a pizza',
      intent: 'order',
      entities: [
        { entity: 'product', value: 'pizza', start: 19, end: 23 },
        {
          entity: 'language',
          value: 'en',
        },
      ],
    },
  ],
  regex_features: [],
  lookup_tables: [
    { name: 'intent', elements: ['greeting', 'order'] },
    { name: 'product', elements: ['pizza', 'sandwich'] },
    { name: 'language', elements: ['en', 'fr'] },
  ],
  entity_synonyms: [
    {
      value: 'pizza',
      synonyms: ['piza', 'pizzza'],
    },
  ],
};

export const nlpParseResult: NlpParseResultType = {
  entities: [
    {
      start: 5,
      end: 7,
      value: 'Joe',
      entity: 'person',
      confidence: 0.4081958281101719,
    },
  ],
  intent: {
    confidence: 0.6081958281101719,
    name: 'greeting',
  },
  intent_ranking: [
    {
      confidence: 0.6081958281101719,
      name: 'greeting',
    },
    {
      confidence: 0.3918041718898281,
      name: 'goodbye',
    },
  ],
  text: 'Hello Joe',
};

export const nlpBestGuess: NLU.ParseEntities = {
  entities: [
    {
      start: 5,
      end: 7,
      value: 'Joe',
      entity: 'person',
      confidence: 0.4081958281101719,
    },
    {
      entity: 'intent',
      value: 'greeting',
      confidence: 0.6081958281101719,
    },
  ],
};
