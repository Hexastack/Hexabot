/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Exclude, Expose } from 'class-transformer';

import type { ChannelName } from '@/channel/types';
import type { SubscriberChannelData } from '@/chat/types/channel';

import type { UserProvider } from '../types/user-provider.type';

import { UserProfileStub } from './user-profile.dto';

@Exclude()
export class UserProfileAssignedStub extends UserProfileStub {
  // Subscriber Specific
  @Expose()
  locale: string | null;

  @Expose()
  gender: string | null;

  @Expose()
  country: string | null;

  @Expose()
  foreignId: string;

  @Expose()
  assignedAt: Date | null;

  @Expose()
  lastvisit: Date | null;

  @Expose()
  retainedFrom: Date | null;

  @Expose()
  channel!: SubscriberChannelData<ChannelName>;

  @Expose({ name: 'labelIds' })
  labels!: string[];

  @Expose({ name: 'assignedToId' })
  assignedTo: string | null;

  // User specific
  @Expose()
  username!: string;

  @Expose()
  email!: string;

  @Expose()
  sendEmail!: boolean;

  @Expose()
  state!: boolean;

  @Expose()
  resetCount!: number;

  @Expose()
  resetToken!: string | null;

  @Expose()
  provider?: UserProvider;

  @Expose({ name: 'roleIds' })
  roles: string[];

  @Expose({ name: 'avatarId' })
  avatar: string;
}
