/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Message, OutgoingMessageFormat } from '@hexabot-ai/types';
import { DataSource } from 'typeorm';

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
      format: OutgoingMessageFormat.text,
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
      format: OutgoingMessageFormat.text,
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
      format: OutgoingMessageFormat.text,
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
  const { subscribers, users } =
    await installSubscriberFixturesTypeOrm(dataSource);

  if (await repository.count()) {
    return await findMessages(dataSource);
  }

  const threads = await Promise.all(
    subscribers.map(async (subscriber) => {
      const existing = await threadRepository.findOne({
        where: { subscriber: { id: subscriber.id } },
      });
      if (existing) {
        return existing;
      }

      return await threadRepository.save(
        threadRepository.create({
          subscriber: { id: subscriber.id },
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
