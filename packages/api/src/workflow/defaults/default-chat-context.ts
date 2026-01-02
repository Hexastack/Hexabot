/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber } from '@/chat/dto/subscriber.dto';
import { ChatContext } from '@/chat/types/chat-context';

/**
 * Default chat context used to bootstrap a workflow run before any
 * user-provided data is captured.
 */
export function getDefaultChatContext(): ChatContext {
  return {
    vars: {},
    channel: null,
    text: null,
    payload: null,
    nlp: null,
    user: {
      firstName: '',
      lastName: '',
    } as Subscriber,
    user_location: {
      lat: 0.0,
      lon: 0.0,
    },
    skip: {},
    attempt: 0,
  };
}

export default getDefaultChatContext;
