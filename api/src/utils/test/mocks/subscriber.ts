/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { customerLabelsMock } from '@/channel/lib/__test__/label.mock';
import { Subscriber, SubscriberFull } from '@/chat/schemas/subscriber.schema';

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
