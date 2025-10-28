/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource, DeepPartial } from 'typeorm';

import { Subscriber, SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

import { installLabelFixturesTypeOrm } from './label';
import { installUserFixturesTypeOrm } from './user';

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

const findSubscriberRelations = async (
  dataSource: DataSource,
): Promise<SubscriberOrmEntity[]> => {
  const repository = dataSource.getRepository(SubscriberOrmEntity);
  return await repository.find({
    relations: ['labels', 'assignedTo', 'avatar'],
  });
};

const findLabelRelations = async (
  dataSource: DataSource,
): Promise<LabelOrmEntity[]> => {
  const repository = dataSource.getRepository(LabelOrmEntity);
  return await repository.find({ relations: ['group', 'users'] });
};

export const installSubscriberFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const subscriberRepository = dataSource.getRepository(SubscriberOrmEntity);

  const [users, labelEntities] = await Promise.all([
    installUserFixturesTypeOrm(dataSource),
    installLabelFixturesTypeOrm(dataSource),
  ]);

  if (await subscriberRepository.count()) {
    return {
      labels: await findLabelRelations(dataSource),
      subscribers: await findSubscriberRelations(dataSource),
      users,
    };
  }

  const assignedUser = users[0] ?? null;

  const entities: DeepPartial<SubscriberOrmEntity>[] = subscriberFixtures.map(
    (fixture) => {
      const {
        labels: _labels,
        assignedTo: _assignedTo,
        avatar: _avatar,
        ...rest
      } = fixture;

      return {
        ...rest,
        locale: rest.locale ?? null,
        language: rest.language ?? null,
        gender: rest.gender ?? null,
        country: rest.country ?? null,
        foreign_id: rest.foreign_id ?? null,
        assignedAt: rest.assignedAt ?? null,
        lastvisit: rest.lastvisit ?? new Date(),
        retainedFrom: rest.retainedFrom ?? new Date(),
        labels: labelEntities.map(
          ({ id }) => ({ id }) as Pick<LabelOrmEntity, 'id'>,
        ),
        assignedTo: assignedUser
          ? ({ id: assignedUser.id } as Pick<UserOrmEntity, 'id'>)
          : null,
        avatar: _avatar ? ({ id: _avatar } as { id: string }) : null,
      };
    },
  );

  await subscriberRepository.save(entities);

  return {
    labels: await findLabelRelations(dataSource),
    subscribers: await findSubscriberRelations(dataSource),
    users,
  };
};
