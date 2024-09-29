/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
