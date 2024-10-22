/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { ConversationCreateDto } from '@/chat/dto/conversation.dto';
import {
  Conversation,
  ConversationModel,
} from '@/chat/schemas/conversation.schema';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixturesDefaultValues } from '../types';

import { installBlockFixtures } from './block';
import { installSubscriberFixtures } from './subscriber';

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
      user: {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        first_name: 'Jhon',
        last_name: 'Doe',
        language: 'fr',
        locale: 'en_EN',
        timezone: 0,
        gender: 'male',
        country: 'FR',
        foreign_id: '',
        labels: [],
        assignedTo: null,
        channel: { name: 'messenger-channel' },
      },
      skip: {},
      attempt: 0,
    },
    current: '0',
    next: ['1', '2'],
  },
  {
    sender: '1',
    context: {
      channel: 'offline-channel',
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
      user: {
        id: '2',
        createdAt: new Date(),
        updatedAt: new Date(),
        first_name: 'Maynard',
        last_name: 'James Keenan',
        language: 'en',
        locale: 'en_EN',
        timezone: 0,
        gender: 'male',
        country: 'US',
        foreign_id: '',
        labels: [],
        assignedTo: null,
        channel: { name: 'offline-channel' },
      },
      skip: {},
      attempt: 0,
    },
    current: '4',
    next: ['3', '4'],
  },
];

export const conversationDefaultValues: TFixturesDefaultValues<Conversation> = {
  active: false,
};

export const conversationFixtures = getFixturesWithDefaultValues<Conversation>({
  fixtures: conversations,
  defaultValues: conversationDefaultValues,
});

export const installConversationTypeFixtures = async () => {
  const subscribers = await installSubscriberFixtures();
  const blocks = await installBlockFixtures();

  const Conversation = mongoose.model(
    ConversationModel.name,
    ConversationModel.schema,
  );
  return await Conversation.insertMany(
    conversationFixtures.map((conversationFixture) => ({
      ...conversationFixture,
      sender: subscribers[parseInt(conversationFixture.sender)].id,
      current: blocks[parseInt(conversationFixture.current)].id,
      next: conversationFixture.next.map((n) => blocks[parseInt(n)].id),
    })),
  );
};
