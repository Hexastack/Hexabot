/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  Subscriber as SharedSubscriber,
  SubscriberFull as SharedSubscriberFull,
  SubscriberStub as SharedSubscriberStub,
} from "@hexabot-ai/types";

type Channel = SharedSubscriber["channel"];

export interface ISubscriberAttributes {
  firstName: SharedSubscriber["firstName"];
  lastName: SharedSubscriber["lastName"];
  locale: SharedSubscriber["locale"];
  gender: SharedSubscriber["gender"];
  labels: string[];
  assignedTo?: string | null;
  assignedAt?: SharedSubscriber["assignedAt"];
  lastvisit?: SharedSubscriber["lastvisit"];
  retainedFrom?: SharedSubscriber["retainedFrom"];
  channel: Channel;
  timezone?: SharedSubscriber["timezone"];
  language: SharedSubscriber["language"];
  country?: SharedSubscriber["country"];
  foreignId?: SharedSubscriber["foreignId"];
}

export interface ISubscriberFilters {
  firstName: string;
  lastName: string;
  channel: Channel;
}

export type SubscriberStub = SharedSubscriberStub & {
  fullName?: string;
};

export type Subscriber = SharedSubscriber & {
  fullName?: string;
};

export type SubscriberFull = SharedSubscriberFull & {
  fullName?: string;
};
