/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { NlpEntityCreateDto } from '../dto/nlp-entity.dto';

export const nlpEntityModels: NlpEntityCreateDto[] = [
  {
    name: 'intent',
    lookups: ['trait'],
    doc: `"intent" refers to the underlying purpose or goal that a piece of text aims to convey. Identifying the intent involves determining what action or response the text is prompting. For instance, in customer service chatbots, recognizing the intent behind a user's message, such as "book a flight" or "check account balance," is crucial to provide accurate and relevant responses`,
    builtin: true,
  },
];
