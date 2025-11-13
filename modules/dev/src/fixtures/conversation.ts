/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { ConversationCreateDto } from '@/chat/dto/conversation.dto';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { ConversationOrmEntity } from '@/chat/entities/conversation.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { getLastTypeOrmDataSource } from '../test';
import { TFixturesDefaultValues } from '../types';

import { blockFixtures, installBlockFixturesTypeOrm } from './block';
import { installSubscriberFixturesTypeOrm } from './subscriber';

const makeConversationUser = (
  overrides: Partial<Subscriber> & Pick<Subscriber, 'id'>,
): Subscriber => {
  const now = new Date();

  return {
    id: overrides.id,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    first_name: overrides.first_name ?? '',
    last_name: overrides.last_name ?? '',
    locale: overrides.locale ?? null,
    timezone: overrides.timezone ?? 0,
    language: overrides.language ?? null,
    gender: overrides.gender ?? null,
    country: overrides.country ?? null,
    foreign_id: overrides.foreign_id ?? '',
    assignedAt: overrides.assignedAt ?? null,
    lastvisit: overrides.lastvisit ?? now,
    retainedFrom: overrides.retainedFrom ?? now,
    channel:
      overrides.channel ??
      ({
        name: 'unknown-channel',
      } as Subscriber['channel']),
    context: overrides.context ?? { vars: {} },
    labels: overrides.labels ?? [],
    assignedTo: overrides.assignedTo ?? null,
    avatar: overrides.avatar ?? null,
  };
};
const conversations: ConversationCreateDto[] = [
  {
    sender: '0',
    active: true,
    context: {
      channel: 'messenger-channel',
      text: 'Hi',
      payload: '',
      nlp: {
        entities: [
          {
            entity: 'intent',
            value: 'greeting',
            confidence: 0.999,
          },
        ],
      },
      vars: {
        age: 30,
        email: 'email@example.com',
      },
      user_location: {
        address: { country: 'FR' },
        lat: 35,
        lon: 45,
      },
      user: makeConversationUser({
        id: '1',
        first_name: 'Jhon',
        last_name: 'Doe',
        language: 'fr',
        locale: 'en_EN',
        gender: 'male',
        country: 'FR',
        foreign_id: 'foreign-id-messenger',
        channel: { name: 'messenger-channel' },
      }),
      skip: {},
      attempt: 0,
    },
    current: '0',
    next: ['1', '2'],
  },
  {
    sender: '1',
    context: {
      channel: 'web-channel',
      text: 'Hello',
      payload: '',
      nlp: {
        entities: [
          {
            entity: 'intent',
            value: 'greeting',
            confidence: 0.999,
          },
        ],
      },
      vars: {
        age: 30,
        email: 'email@example.com',
      },
      user_location: {
        address: { country: 'US' },
        lat: 15,
        lon: 45,
      },
      user: makeConversationUser({
        id: '2',
        first_name: 'Maynard',
        last_name: 'James Keenan',
        language: 'en',
        locale: 'en_EN',
        timezone: 0,
        gender: 'male',
        country: 'US',
        foreign_id: 'foreign-id-web-1',
        channel: { name: 'web-channel' },
      }),
      skip: {},
      attempt: 0,
    },
    current: '4',
    next: ['3', '4'],
  },
];

export const conversationDefaultValues: TFixturesDefaultValues<ConversationCreateDto> =
  {
    active: false,
  };

export const conversationFixtures =
  getFixturesWithDefaultValues<ConversationCreateDto>({
    fixtures: conversations,
    defaultValues: conversationDefaultValues,
  });

const findConversations = async (dataSource: DataSource) =>
  await dataSource.getRepository(ConversationOrmEntity).find({
    relations: ['sender', 'current', 'next'],
  });

export const installConversationFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(ConversationOrmEntity);

  if (await repository.count()) {
    return await findConversations(dataSource);
  }

  const [blocks, { subscribers }] = await Promise.all([
    installBlockFixturesTypeOrm(dataSource),
    installSubscriberFixturesTypeOrm(dataSource),
  ]);
  const blocksByName = new Map(blocks.map((block) => [block.name, block]));
  const getBlockByIndex = (index: string | undefined) => {
    if (index == null) {
      return null;
    }

    const blockFixture = blockFixtures[Number.parseInt(index, 10)];
    if (!blockFixture) {
      return null;
    }

    const blockName = blockFixture.name;
    if (!blockName) {
      return null;
    }

    return blocksByName.get(blockName) ?? null;
  };
  const conversationsToCreate = conversationFixtures.map((fixture) => {
    const { sender, current, next, ...rest } = fixture;
    const senderIndex = Number.parseInt(sender, 10);
    const senderEntity = subscribers[senderIndex];
    if (!senderEntity) {
      throw new Error(
        `Missing subscriber fixture at index ${sender} for conversation fixtures`,
      );
    }

    const currentEntity = getBlockByIndex(current ?? undefined);
    const nextEntities = (next ?? [])
      .map((n) => getBlockByIndex(n))
      .filter(
        (block): block is Exclude<typeof block, null> =>
          block !== null && block !== undefined,
      );
    const context = {
      ...(rest.context ?? {}),
      user: {
        id: senderEntity.id,
        createdAt: senderEntity.createdAt,
        updatedAt: senderEntity.updatedAt,
        first_name: senderEntity.first_name,
        last_name: senderEntity.last_name,
        locale: senderEntity.locale ?? null,
        timezone: senderEntity.timezone ?? 0,
        language: senderEntity.language ?? null,
        gender: senderEntity.gender ?? null,
        country: senderEntity.country ?? null,
        foreign_id: senderEntity.foreign_id ?? '',
        assignedAt: senderEntity.assignedAt ?? null,
        lastvisit: senderEntity.lastvisit ?? null,
        retainedFrom: senderEntity.retainedFrom ?? null,
        // @todo : remove any
        channel: senderEntity.channel as any,
        context: senderEntity.context,
      },
    };

    return repository.create({
      ...rest,
      context,
      sender: { id: senderEntity.id } satisfies Pick<SubscriberOrmEntity, 'id'>,
      current: currentEntity
        ? ({ id: currentEntity.id } satisfies Pick<BlockOrmEntity, 'id'>)
        : null,
      next: nextEntities.map(
        (block) => ({ id: block.id }) satisfies Pick<BlockOrmEntity, 'id'>,
      ),
    });
  });

  await repository.save(conversationsToCreate);

  return await findConversations(dataSource);
};

export const installConversationTypeFixtures = async () => {
  const dataSource = getLastTypeOrmDataSource();
  if (!dataSource) {
    throw new Error(
      'No TypeORM data source registered for conversation fixtures',
    );
  }

  return await installConversationFixturesTypeOrm(dataSource);
};
