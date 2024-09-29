/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Nlp } from '@/nlp/lib/types';

import { Payload } from './quick-reply';
import { Subscriber } from '../subscriber.schema';

export interface Context {
  channel?: string;
  text?: string;
  payload?: Payload | string;
  nlp?: Nlp.ParseEntities | null;
  vars: { [key: string]: any };
  user_location: {
    address?: Record<string, string>;
    lat: number;
    lon: number;
  };
  user: Subscriber;
  skip: Record<string, number>;
  attempt: number;
}
