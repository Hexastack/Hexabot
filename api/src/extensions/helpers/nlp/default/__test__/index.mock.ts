/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Nlp } from '@/nlp/lib/types';

import { DatasetType, NlpParseResultType } from '../types';

export const nlpEmptyFormated: DatasetType = {
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
  ],
  entity_synonyms: [
    {
      value: 'pizza',
      synonyms: ['piza', 'pizzza'],
    },
  ],
};

export const nlpFormatted: DatasetType = {
  common_examples: [
    { text: 'Hello', intent: 'greeting', entities: [] },
    {
      text: 'i want to order a pizza',
      intent: 'order',
      entities: [{ entity: 'product', value: 'pizza', start: 19, end: 23 }],
    },
  ],
  regex_features: [],
  lookup_tables: [
    { name: 'intent', elements: ['greeting', 'order'] },
    { name: 'product', elements: ['pizza', 'sandwich'] },
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

export const nlpBestGuess: Nlp.ParseEntities = {
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
