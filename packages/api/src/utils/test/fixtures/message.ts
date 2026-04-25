/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Message, OutgoingMessageType } from '@hexabot-ai/types';
import { DataSource } from 'typeorm';

import { SourceOrmEntity } from '@/channel/entities/source.entity';
import { MessageCreateDto } from '@/chat/dto/message.dto';
import { MessageOrmEntity } from '@/chat/entities/message.entity';
import { ThreadOrmEntity } from '@/chat/entities/thread.entity';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder, TFixturesDefaultValues } from '../types';

import { installSubscriberFixturesTypeOrm } from './subscriber';

type TMessageFixtures = FixturesTypeBuilder<Message, MessageCreateDto>;

const messages: TMessageFixtures['values'][] = [
  {
    mid: 'mid-1',
    sender: '1',
    recipient: '1',
    thread: '1',
    sentBy: '0',
    message: {
      type: OutgoingMessageType.text,
      data: { text: 'Hello from the past' },
    },
    read: true,
    delivery: true,
  },
  {
    mid: 'mid-2',
    sender: '1',
    recipient: '1',
    thread: '1',
    sentBy: '0',
    message: {
      type: OutgoingMessageType.text,
      data: { text: 'Hello' },
    },
    delivery: true,
  },
  {
    mid: 'mid-3',
    sender: '1',
    recipient: '1',
    thread: '1',
    sentBy: '0',
    message: {
      type: OutgoingMessageType.text,
      data: { text: 'Hello back' },
    },
  },
];

export const messageDefaultValues: TFixturesDefaultValues<Message> = {
  read: false,
  delivery: false,
  handover: false,
};

export const messageFixtures = getFixturesWithDefaultValues<
  Message,
  TMessageFixtures['values']
>({
  fixtures: messages,
  defaultValues: messageDefaultValues,
});

const findMessages = async (dataSource: DataSource) =>
  await dataSource.getRepository(MessageOrmEntity).find({
    relations: ['sender', 'recipient', 'sentBy'],
  });
const resolveSubscriberSourceId = (source: unknown): string | null => {
  if (typeof source === 'string' && source.length > 0) {
    return source;
  }

  if (source && typeof source === 'object' && 'id' in source) {
    const sourceId = (source as { id?: unknown }).id;
    if (typeof sourceId === 'string' && sourceId.length > 0) {
      return sourceId;
    }
  }

  return null;
};
const resolveSubscriberChannelName = (channel: unknown): string | null => {
  if (
    channel &&
    typeof channel === 'object' &&
    'name' in channel &&
    typeof (channel as { name?: unknown }).name === 'string'
  ) {
    const channelName = (channel as { name: string }).name.trim();

    return channelName.length > 0 ? channelName : null;
  }

  return null;
};
const parseIndex = (value?: string | null) => {
  if (value == null) {
    return null;
  }

  const index = Number.parseInt(value, 10);

  return Number.isNaN(index) ? null : index;
};

export const installMessageFixturesTypeOrm = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(MessageOrmEntity);
  const threadRepository = dataSource.getRepository(ThreadOrmEntity);
  const sourceRepository = dataSource.getRepository(SourceOrmEntity);
  const { subscribers, users } =
    await installSubscriberFixturesTypeOrm(dataSource);

  if (await repository.count()) {
    return await findMessages(dataSource);
  }

  const sourceIdByChannel = new Map<string, string>(
    (await sourceRepository.find()).map((source) => [
      source.channel,
      source.id,
    ]),
  );
  const threads = await Promise.all(
    subscribers.map(async (subscriber) => {
      const existing = await threadRepository.findOne({
        where: { subscriber: { id: subscriber.id } },
      });
      if (existing) {
        return existing;
      }

      let sourceId = resolveSubscriberSourceId(subscriber.source);

      if (!sourceId) {
        const channelName = resolveSubscriberChannelName(subscriber.channel);

        if (!channelName) {
          return null;
        }

        sourceId = sourceIdByChannel.get(channelName) ?? null;

        if (!sourceId) {
          const source = await sourceRepository.save(
            sourceRepository.create({
              name: `fixture-source-${channelName}`,
              channel: channelName,
              settings: {},
              state: true,
              defaultWorkflow: null,
            }),
          );

          sourceId = source.id;
          sourceIdByChannel.set(channelName, sourceId);
        }
      }

      return await threadRepository.save(
        threadRepository.create({
          subscriber: { id: subscriber.id },
          source: { id: sourceId },
          status: 'open',
          lastMessageAt: new Date(),
        }),
      );
    }),
  );
  const entities = messageFixtures.map((fixture) => {
    const senderIndex = parseIndex(fixture.sender);
    const recipientIndex = parseIndex(fixture.recipient);
    const sentByIndex = parseIndex(fixture.sentBy);
    const sender =
      senderIndex != null && subscribers[senderIndex]
        ? { id: subscribers[senderIndex].id }
        : null;
    const recipient =
      recipientIndex != null && subscribers[recipientIndex]
        ? { id: subscribers[recipientIndex].id }
        : null;
    const sentBy =
      sentByIndex != null && users[sentByIndex]
        ? { id: users[sentByIndex].id }
        : null;
    const threadIndex = parseIndex(fixture.thread);
    const thread =
      threadIndex != null && threads[threadIndex]
        ? { id: threads[threadIndex].id }
        : senderIndex != null && threads[senderIndex]
          ? { id: threads[senderIndex].id }
          : null;
    if (!thread) {
      throw new Error('Unable to resolve thread fixture for message');
    }

    return repository.create({
      mid: fixture.mid ?? null,
      message: fixture.message,
      read: fixture.read ?? false,
      delivery: fixture.delivery ?? false,
      handover: fixture.handover ?? false,
      sender,
      recipient,
      sentBy,
      thread,
      createdAt: fixture.createdAt,
    });
  });

  await repository.save(entities);

  return await findMessages(dataSource);
};
