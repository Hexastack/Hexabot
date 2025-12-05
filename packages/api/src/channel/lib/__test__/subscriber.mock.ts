/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber } from '@/chat/dto/subscriber.dto';

import { modelInstance } from './base.mock';
import { customerLabelsMock } from './label.mock';

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

export const subscriberWithLabels: Subscriber = {
  ...subscriberWithoutLabels,
  labels: customerLabelsMock.map(({ id }) => id),
  assignedTo: null,
};
