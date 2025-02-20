/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { OutgoingMessageFormat } from '@/chat/schemas/types/message';

import { StdOutgoingAttachmentEnvelopeBuilder } from './StdOutgoingAttachmentEnvelopeBuilder';
import { StdOutgoingButtonsEnvelopeBuilder } from './StdOutgoingButtonsEnvelopeBuilder';
import { StdOutgoingListEnvelopeBuilder } from './StdOutgoingListEnvelope';
import { StdOutgoingQuickReplyEnvelopeBuilder } from './StdOutgoingQuickRepliesEnvelope';
import { StdOutgoingTextEnvelopeBuilder } from './StdOutgoingTextEnvelope';

// export interface OutgoingEnvelopeBuilder<T> {
//   build(): T;
// }

export type BuilderMap = {
  [OutgoingMessageFormat.text]: StdOutgoingTextEnvelopeBuilder;
  [OutgoingMessageFormat.quickReplies]: StdOutgoingQuickReplyEnvelopeBuilder;
  [OutgoingMessageFormat.buttons]: StdOutgoingButtonsEnvelopeBuilder;
  [OutgoingMessageFormat.list]: StdOutgoingListEnvelopeBuilder;
  [OutgoingMessageFormat.attachment]: StdOutgoingAttachmentEnvelopeBuilder;
};
