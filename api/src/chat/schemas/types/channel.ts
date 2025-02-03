/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

import { ChannelName } from '@/channel/types';

export type SubscriberChannelData<C extends ChannelName = 'unknown-channel'> =
  C extends 'unknown-channel'
    ? { name: ChannelName }
    : {
        name: C;
      } & {
        // Channel's specific attributes
        [P in keyof SubscriberChannelDict[C]]: SubscriberChannelDict[C][P];
      };

export const channelDataSchema = z
  .object({
    name: z.string().regex(/-channel$/) as z.ZodType<ChannelName>,
  })
  .passthrough();

export type Channel = z.infer<typeof channelDataSchema>;
