/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { Subscriber, SubscriberModel } from '@/chat/schemas/subscriber.schema';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

import { installLabelFixtures } from './label';
import { installUserFixtures } from './user';

type TSubscriberFixtures = FixturesTypeBuilder<Subscriber, SubscriberCreateDto>;

export const subscriberDefaultValues: TSubscriberFixtures['defaultValues'] = {
  timezone: 0,
  assignedTo: null,
  assignedAt: null,
  lastvisit: new Date(),
  retainedFrom: new Date(),
  avatar: null,
  context: {
    vars: {},
  },
};

const subscribers: TSubscriberFixtures['values'][] = [
  {
    foreign_id: 'foreign-id-messenger',
    first_name: 'Jhon',
    last_name: 'Doe',
    language: 'fr',
    locale: 'en_EN',
    gender: 'male',
    country: 'FR',
    channel: {
      name: 'messenger-channel',
    },
    labels: [],
    lastvisit: new Date('2020-01-01T20:40:03.249Z'),
    retainedFrom: new Date('2020-01-01T20:40:03.249Z'),
  },
  {
    foreign_id: 'foreign-id-web-1',
    first_name: 'Maynard',
    last_name: 'James Keenan',
    language: 'en',
    locale: 'en_EN',
    gender: 'male',
    country: 'US',
    channel: {
      name: 'web-channel',
    },
    labels: [],
    lastvisit: new Date('2021-01-01T20:40:03.249Z'),
    retainedFrom: new Date('2021-01-02T20:40:03.249Z'),
  },
  {
    foreign_id: 'foreign-id-web-2',
    first_name: 'Queen',
    last_name: 'Elisabeth',
    language: 'en',
    locale: 'en_EN',
    gender: 'male',
    country: 'US',
    channel: {
      name: 'web-channel',
    },
    labels: [],
    lastvisit: new Date('2022-01-01T20:40:03.249Z'),
    retainedFrom: new Date('2022-01-02T20:40:03.249Z'),
  },
  {
    foreign_id: 'foreign-id-dimelo',
    first_name: 'Carl',
    last_name: 'Jung',
    language: 'en',
    locale: 'en_EN',
    gender: 'male',
    country: 'US',
    channel: {
      name: 'web-channel',
    },
    labels: [],
    lastvisit: new Date('2024-01-01T20:40:03.249Z'),
    retainedFrom: new Date('2024-01-02T20:40:03.249Z'),
  },
];

export const subscriberFixtures = getFixturesWithDefaultValues<
  TSubscriberFixtures['values']
>({
  fixtures: subscribers,
  defaultValues: subscriberDefaultValues,
});

export const installSubscriberFixtures = async () => {
  const Subscriber = mongoose.model(
    SubscriberModel.name,
    SubscriberModel.schema,
  );
  const { users } = await installUserFixtures();
  const labels = await installLabelFixtures();
  const subscribers = await Subscriber.insertMany(
    subscriberFixtures.map((subscriberFixture) => ({
      ...subscriberFixture,
      labels: labels.map(({ _id }) => _id.toString()),
      assignedTo: users[0].id,
    })),
  );
  return { labels, subscribers, users };
};
