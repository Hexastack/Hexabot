/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { SubscriberStub } from '@/chat/schemas/subscriber.schema';

declare module 'express-session' {
  interface SessionUser {
    id?: string;
    first_name?: string;
    last_name?: string;
  }

  interface SessionData<T extends SubscriberStub> {
    passport?: {
      user?: SessionUser;
    };
    web?: {
      profile?: T;
      isSocket: boolean;
      messageQueue: any[];
      polling: boolean;
    };
  }

  interface Session {
    csrfSecret?: string;
    passport?: {
      user?: SessionUser;
    };
    web?: {
      profile?: SubscriberStub;
      isSocket: boolean;
      messageQueue: any[];
      polling: boolean;
    };
  }
}
