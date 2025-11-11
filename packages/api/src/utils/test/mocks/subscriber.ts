/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { customerLabelsMock } from '@/channel/lib/__test__/label.mock';
import { Subscriber, SubscriberFull } from '@/chat/dto/subscriber.dto';

import { modelInstance } from './misc';

export const subscriberInstance: Subscriber = {
  foreign_id: 'foreign-id-for-jhon-doe',
  first_name: 'John',
  last_name: 'Doe',
  language: 'fr',
  locale: 'fr_FR',
  gender: 'male',
  timezone: -1,
  country: 'TN',
  assignedTo: null,
  assignedAt: null,
  lastvisit: new Date(),
  retainedFrom: new Date(),
  channel: {
    name: 'web-channel',
  },
  labels: [],
  avatar: null,
  context: {},
  ...modelInstance,
};

export const subscriberWithoutLabels: Subscriber = {
  ...subscriberInstance,
  labels: [],
};

export const subscriberWithLabels: SubscriberFull = {
  ...subscriberWithoutLabels,
  labels: customerLabelsMock,
  assignedTo: null,
  avatar: null,
};
