/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ZodSchema } from 'zod';

import { OutgoingMessageFormat } from '@/chat/schemas/types/message';

import { StdOutgoingAttachmentEnvelopeBuilder } from './StdOutgoingAttachmentEnvelopeBuilder';
import { StdOutgoingButtonsEnvelopeBuilder } from './StdOutgoingButtonsEnvelopeBuilder';
import { StdOutgoingListEnvelopeBuilder } from './StdOutgoingListEnvelope';
import { StdOutgoingQuickReplyEnvelopeBuilder } from './StdOutgoingQuickRepliesEnvelope';
import { StdOutgoingTextEnvelopeBuilder } from './StdOutgoingTextEnvelope';

// TODO: pass Class to this interface & generate an interface that requires setClassAttributes & returns this
export interface OutgoingEnvelopeBuilder<T> {
  build(): T;
  validate(
    zodSchema: ZodSchema<T>,
    data: unknown,
  ): ReturnType<ZodSchema['safeParse']>;
}

// class B implements OutgoingEnvelopeBuilder<StdOutgoingList> {
//   build(): StdOutgoingList {
//     throw new Error('Method not implemented.');
//   }

//   validate(
//     zodSchema: ZodSchema<StdOutgoingList, ZodTypeDef, StdOutgoingList>,
//     data: unknown,
//   ): ReturnType<ZodSchema['safeParse']> {
//     return stdOutgoingListEnvelopeSchema.safeParse(data);
//   }
// }

export type BuilderMap = {
  [OutgoingMessageFormat.text]: StdOutgoingTextEnvelopeBuilder;
  [OutgoingMessageFormat.quickReplies]: StdOutgoingQuickReplyEnvelopeBuilder;
  [OutgoingMessageFormat.buttons]: StdOutgoingButtonsEnvelopeBuilder;
  [OutgoingMessageFormat.list]: StdOutgoingListEnvelopeBuilder;
  [OutgoingMessageFormat.attachment]: StdOutgoingAttachmentEnvelopeBuilder;
};

// export type DeepOutgoingEnvelopeBuilder<T> = {
//   [K in keyof T as `set${Capitalize<string & K>}`]: T[K] extends object
//     ? (
//         value: DeepOutgoingEnvelopeBuilder<T[K]>,
//       ) => DeepOutgoingEnvelopeBuilder<T>
//     : (value: T[K]) => DeepOutgoingEnvelopeBuilder<T>;
// } & {
//   build(): T;
// };

// class A implements DeepOutgoingEnvelopeBuilder<StdOutgoingList> {
//   setFormat: (
//     value: OutgoingMessageFormat.list | OutgoingMessageFormat.carousel,
//   ) => DeepOutgoingEnvelopeBuilder<StdOutgoingList>;

//   setMessage: (
//     value: DeepOutgoingEnvelopeBuilder<{
//       options: ContentOptions;
//       elements: ContentElement[];
//       pagination: { total: number; skip: number; limit: number };
//     }>,
//   ) => DeepOutgoingEnvelopeBuilder<StdOutgoingList>;

//   build(): StdOutgoingList {
//     throw new Error('Method not implemented.');
//   }
// }
