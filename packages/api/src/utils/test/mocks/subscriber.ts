/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber, SubscriberFull } from '@hexabot-ai/types';

import { customerLabelsMock } from '@/channel/lib/__test__/label.mock';

import { modelInstance } from './misc';

export const subscriberInstance: Subscriber = {
  foreignId: 'foreign-id-for-jhon-doe',
  firstName: 'John',
  lastName: 'Doe',
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
    name: 'web',
  },
  labels: [],
  avatar: null,
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
