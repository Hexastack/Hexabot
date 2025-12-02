/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber } from '@/chat/dto/subscriber.dto';

declare module 'express-session' {
  interface SessionUser {
    id?: string;
    first_name?: string;
    last_name?: string;
  }

  interface SessionData {
    cookie: Cookie;
    csrfSecret?: string;
    passport?: {
      user?: SessionUser;
    };
    web?: {
      profile?: Subscriber;
      isSocket: boolean;
      messageQueue: any[];
      polling: boolean;
    };
    anonymous?: boolean;
  }
}
