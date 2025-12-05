/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber } from '../dto/subscriber.dto';
import { Context } from '../types/context';

export function getDefaultConversationContext(): Context {
  return {
    vars: {}, // Used for capturing vars from user entries
    channel: null,
    text: null,
    payload: null,
    nlp: null,
    user: {
      firstName: '',
      lastName: '',
      // @TODO: Typing is not correct
    } as Subscriber,
    user_location: {
      // Used for capturing geolocation from QR
      lat: 0.0,
      lon: 0.0,
    },
    skip: {}, // Used for list pagination
    attempt: 0, // Used to track fallback max attempts
  };
}
