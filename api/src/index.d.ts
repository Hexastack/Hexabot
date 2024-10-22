/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import 'mongoose';
import { SubscriberStub } from './chat/schemas/subscriber.schema';
import {
  ObjectWithNestedKeys,
  RecursivePartial,
  WithoutGenericAny,
} from './utils/types/filter.types';

type TOmitId<T> = Omit<T, 'id'>;
type TReplaceId<T> = TOmitId<T> & { _id?: string };
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

declare module 'mongoose' {
  // Enforce the typing with an alternative type to FilterQuery compatible with mongoose: version 8.0.0
  type TFilterQuery<T, S = TReplaceId<T>> = (
    | RecursivePartial<{
        [P in keyof S]?:
          | (S[P] extends string ? S[P] | RegExp : S[P])
          | QuerySelector<S[P]>;
      }>
    | Partial<ObjectWithNestedKeys<S>>
  ) &
    WithoutGenericAny<RootQuerySelector<S>>;

  type THydratedDocument<T> = TOmitId<HydratedDocument<T>>;
}

declare global {
  type HyphenToUnderscore<S extends string> = S extends `${infer P}-${infer Q}`
    ? `${P}_${HyphenToUnderscore<Q>}`
    : S;
}
