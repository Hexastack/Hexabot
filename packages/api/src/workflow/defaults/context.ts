/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber } from '@/chat/dto/subscriber.dto';
import { Context } from '@/chat/types/context';

/**
 * Default chat context used to bootstrap a workflow run before any
 * user-provided data is captured.
 */
export function getDefaultWorkflowContext(): Context {
  return {
    vars: {},
    channel: null,
    text: null,
    payload: null,
    nlp: null,
    user: {
      first_name: '',
      last_name: '',
    } as Subscriber,
    user_location: {
      lat: 0.0,
      lon: 0.0,
    },
    skip: {},
    attempt: 0,
  };
}

export default getDefaultWorkflowContext;
