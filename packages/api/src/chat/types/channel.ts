/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { ChannelName } from '@/channel/types';

// @todo : rename
export type SubscriberChannelData<C extends ChannelName = 'unknown-channel'> =
  C extends 'unknown-channel'
    ? { name: ChannelName }
    : {
        name: C;
      } & {
        data?: {
          // Channel's specific attributes
          [P in keyof SubscriberChannelDict[C]]: SubscriberChannelDict[C][P];
        };
      };

export const channelDataSchema = z
  .object({
    name: z.string().regex(/-channel$/) as z.ZodType<ChannelName>,
  })
  .passthrough();

export type Channel = z.infer<typeof channelDataSchema>;
