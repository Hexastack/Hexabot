/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber } from '@hexabot-ai/types';
import { DataSource } from 'typeorm';

import { SourceOrmEntity } from '@/channel/entities/source.entity';
import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { EUserProfileType } from '@/user/entities/user-profile.entity';
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
};

const subscribers: TSubscriberFixtures['values'][] = [
  {
    source: '11111111-1111-4111-8111-111111111111',
    foreignId: 'foreign-id-messenger',
    firstName: 'Jhon',
    lastName: 'Doe',
    language: 'fr',
    locale: 'en_EN',
    gender: 'male',
    country: 'FR',
    channel: {
      name: 'messenger',
    },
    labels: [],
    lastvisit: new Date('2020-01-01T20:40:03.249Z'),
    retainedFrom: new Date('2020-01-01T20:40:03.249Z'),
  },
  {
    source: '22222222-2222-4222-8222-222222222222',
    foreignId: 'foreign-id-web-1',
    firstName: 'Maynard',
    lastName: 'James Keenan',
    language: 'en',
    locale: 'en_EN',
    gender: 'male',
    country: 'US',
    channel: {
      name: 'web',
    },
    labels: [],
    lastvisit: new Date('2021-01-01T20:40:03.249Z'),
    retainedFrom: new Date('2021-01-02T20:40:03.249Z'),
  },
  {
    source: '33333333-3333-4333-8333-333333333333',
    foreignId: 'foreign-id-web-2',
    firstName: 'Queen',
    lastName: 'Elisabeth',
    language: 'en',
    locale: 'en_EN',
    gender: 'male',
    country: 'US',
    channel: {
      name: 'web',
    },
    labels: [],
    lastvisit: new Date('2022-01-01T20:40:03.249Z'),
    retainedFrom: new Date('2022-01-02T20:40:03.249Z'),
  },
  {
    source: '44444444-4444-4444-8444-444444444444',
    foreignId: 'foreign-id-dimelo',
    firstName: 'Carl',
    lastName: 'Jung',
    language: 'en',
    locale: 'en_EN',
    gender: 'male',
    country: 'US',
    channel: {
      name: 'web',
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

const findSubscriberRelations = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(SubscriberOrmEntity);

  return await repository.find({
    relations: ['labels', 'assignedTo', 'avatar', 'source'],
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
  const sourceRepository = dataSource.getRepository(SourceOrmEntity);
  const [users, labelEntities] = await Promise.all([
    installUserFixturesTypeOrm(dataSource),
    installLabelFixturesTypeOrm(dataSource),
  ]);
  const channelNames = Array.from(
    new Set(
      subscriberFixtures
        .map((fixture) => fixture.channel?.name)
        .filter(
          (name): name is string =>
            typeof name === 'string' && name.trim().length > 0,
        ),
    ),
  );
  const sourceIdByChannel = new Map<string, string>();

  for (const channelName of channelNames) {
    const sourceName = `fixture-source-${channelName}`;
    let source = await sourceRepository.findOne({
      where: { name: sourceName },
    });

    if (!source) {
      source = await sourceRepository.save(
        sourceRepository.create({
          name: sourceName,
          channel: channelName,
          settings: {},
          state: true,
          defaultWorkflow: null,
        }),
      );
    }

    sourceIdByChannel.set(channelName, source.id);
  }

  if (
    await subscriberRepository.count({
      where: { type: EUserProfileType.SubscriberOrmEntity },
    })
  ) {
    return {
      labels: await findLabelRelations(dataSource),
      subscribers: await findSubscriberRelations(dataSource),
      users,
    };
  }

  const assignedUser = users[0] ?? null;

  for (const fixture of subscriberFixtures) {
    const {
      labels: _labels,
      assignedTo: _assignedTo,
      avatar: _avatar,
      source: _source,
      ...rest
    } = fixture;
    const channelName = rest.channel?.name;
    if (!channelName) {
      throw new Error('Missing fixture channel while seeding subscribers');
    }
    const sourceId = sourceIdByChannel.get(channelName);
    if (!sourceId) {
      throw new Error(`Missing fixture source for channel ${channelName}`);
    }
    const entity = new SubscriberOrmEntity();
    Object.assign(entity, {
      ...rest,
      locale: rest.locale ?? null,
      language: rest.language ?? null,
      gender: rest.gender ?? null,
      country: rest.country ?? null,
      foreignId: rest.foreignId,
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
      source: { id: sourceId } as Pick<SourceOrmEntity, 'id'> & SourceOrmEntity,
    });

    await subscriberRepository.save(entity);
  }

  return {
    labels: await findLabelRelations(dataSource),
    subscribers: await findSubscriberRelations(dataSource),
    users,
  };
};
