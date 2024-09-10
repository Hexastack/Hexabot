/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { NlpEntityCreateDto } from '../dto/nlp-entity.dto';

export const nlpEntityModels: NlpEntityCreateDto[] = [
  {
    name: 'language',
    lookups: ['trait'],
    doc: `"language" refers to the language of the text sent by the end user`,
    builtin: true,
  },
  {
    name: 'intent',
    lookups: ['trait'],
    doc: `"intent" refers to the underlying purpose or goal that a piece of text aims to convey. Identifying the intent involves determining what action or response the text is prompting. For instance, in customer service chatbots, recognizing the intent behind a user's message, such as "book a flight" or "check account balance," is crucial to provide accurate and relevant responses`,
    builtin: true,
  },
];
