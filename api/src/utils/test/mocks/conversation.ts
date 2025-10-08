/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Block, BlockStub } from '@/chat/schemas/block.schema';
import { ConversationFull } from '@/chat/schemas/conversation.schema';
import { Context } from '@/chat/schemas/types/context';
import { SubscriberContext } from '@/chat/schemas/types/subscriberContext';

import { quickRepliesBlock, textBlock } from './block';
import { modelInstance } from './misc';
import { subscriberInstance } from './subscriber';

export const contextBlankInstance: Context = {
  channel: 'web-channel',
  text: '',
  payload: undefined,
  nlp: { entities: [] },
  vars: {},
  user_location: {
    lat: 0,
    lon: 0,
  },
  user: subscriberInstance,
  skip: {},
  attempt: 1,
};

export const subscriberContextBlankInstance: SubscriberContext = {
  vars: {},
};

export const contextEmailVarInstance: Context = {
  ...contextBlankInstance,
  vars: {
    email: 'email@example.com',
  },
};

export const contextGetStartedInstance: Context = {
  channel: 'web-channel',
  text: 'Get Started',
  payload: 'GET_STARTED',
  nlp: { entities: [] },
  vars: {
    email: 'email@example.com',
  },
  user_location: {
    lat: 0,
    lon: 0,
  },
  user: subscriberInstance,
  skip: {},
  attempt: 1,
};

export const conversationGetStarted: ConversationFull = {
  sender: subscriberInstance,
  active: true,
  context: contextGetStartedInstance,
  current: textBlock as BlockStub as Block,
  next: [quickRepliesBlock as any as Block],
  ...modelInstance,
};
