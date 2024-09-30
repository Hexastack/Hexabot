/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { PayloadType } from './message';

export interface PayloadPattern {
  label: string;
  value: string;
  // @todo : rename 'attachment' to 'attachments'
  type?: PayloadType;
}

export type NlpPattern =
  | {
      entity: string;
      match: 'entity';
    }
  | {
      entity: string;
      match: 'value';
      value: string;
    };

export type Pattern = string | RegExp | PayloadPattern | NlpPattern[];
