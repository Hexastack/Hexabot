/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Block, BlockStub } from '@/chat/schemas/block.schema';
import { ConversationFull } from '@/chat/schemas/conversation.schema';
import { Context } from '@/chat/schemas/types/context';

import { quickRepliesBlock, textBlock } from './block';
import { modelInstance } from './misc';
import { subscriberInstance } from './subscriber';

export const contextBlankInstance: Context = {
  channel: 'offline',
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

export const contextEmailVarInstance: Context = {
  ...contextBlankInstance,
  vars: {
    email: 'email@example.com',
  },
};

export const contextGetStartedInstance: Context = {
  channel: 'offline',
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
