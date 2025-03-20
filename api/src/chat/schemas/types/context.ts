/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ChannelName } from '@/channel/types';
import { NLU } from '@/helper/types';

import { Subscriber } from '../subscriber.schema';

import { Payload } from './quick-reply';

export interface Context {
  channel?: ChannelName;
  text?: string;
  payload?: Payload | string;
  nlp?: NLU.ParseEntities | null;
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

export interface TemplateContext {
  context: Context;
  contact: Settings['contact'];
}
