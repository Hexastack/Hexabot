/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { OutgoingMessageFormat } from '@/chat/schemas/types/message';

import {
  StdOutgoingQuickReplyEnvelopeBuilder,
  StdOutgoingTextEnvelopeBuilder,
} from './envelope-builders';
import { BuilderMap } from './envelope-builders/interface';
import { StdOutgoingAttachmentEnvelopeBuilder } from './envelope-builders/StdOutgoingAttachmentEnvelopeBuilder';
import { StdOutgoingButtonsEnvelopeBuilder } from './envelope-builders/StdOutgoingButtonsEnvelopeBuilder';
import { StdOutgoingListEnvelopeBuilder } from './envelope-builders/StdOutgoingListEnvelope';

@Injectable()
export class StdOutgoingEnvelopeFactory {
  // Attempt 1:
  // createBuilder<T extends keyof BuilderMap>(format: T): BuilderMap[T] {
  //   switch (format) {
  //     case OutgoingMessageFormat.text:
  //       return new StdOutgoingTextEnvelopeBuilder() as BuilderMap[T];
  //     case OutgoingMessageFormat.quickReplies:
  //       return new StdOutgoingQuickReplyEnvelopeBuilder() as BuilderMap[T];
  //     case OutgoingMessageFormat.buttons:
  //       return new StdOutgoingButtonsEnvelopeBuilder() as BuilderMap[T];
  //     case OutgoingMessageFormat.list:
  //       return new StdOutgoingListEnvelopeBuilder() as BuilderMap[T];
  //     case OutgoingMessageFormat.attachment:
  //       return new StdOutgoingAttachmentEnvelopeBuilder() as BuilderMap[T];
  //     default:
  //       throw new Error(`Unsupported envelope format: ${format}`);
  //   }
  // }

  // Attempt 2
  createBuilder<T extends keyof BuilderMap>(format: T): BuilderMap[T] {
    const builderMap: BuilderMap = {
      [OutgoingMessageFormat.text]: new StdOutgoingTextEnvelopeBuilder(),
      [OutgoingMessageFormat.quickReplies]:
        new StdOutgoingQuickReplyEnvelopeBuilder(),
      [OutgoingMessageFormat.buttons]: new StdOutgoingButtonsEnvelopeBuilder(),
      [OutgoingMessageFormat.list]: new StdOutgoingListEnvelopeBuilder(),
      [OutgoingMessageFormat.attachment]:
        new StdOutgoingAttachmentEnvelopeBuilder(),
    };
    const builder = builderMap[format];
    if (!builder) {
      throw new Error(`format ${format} does not have a corresponding builder`);
    }
    return builderMap[format];
  }
}
