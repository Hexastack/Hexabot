/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { OutgoingMessageFormat } from '@/chat/schemas/types/message';
import { StdQuickReply } from '@/chat/schemas/types/quick-reply';

import { stdOutgoingQuickRepliesEnvelopeSchema } from './../../../chat/schemas/types/message';

export class StdOutgoingQuickReplyEnvelopeBuilder {
  private quickReplies: StdQuickReply[] = [];

  private text: string;

  constructor() {}

  setText(text: string) {
    this.text = text;
    return this;
  }

  buildAndAppendQuickReply(stdQuickReply: StdQuickReply) {
    this.quickReplies.push(stdQuickReply);
    return this;
  }

  build() {
    const stdOutgoingQuickReply = new StdOutgoingQuickReply(
      this.text,
      this.quickReplies,
    );
    if (this.isValid(stdOutgoingQuickReply)) {
      return stdOutgoingQuickReply;
    }

    throw new Error('stdOutgoingQuickReply invalid shape');
  }

  private isValid(data: unknown) {
    return stdOutgoingQuickRepliesEnvelopeSchema.safeParse(data).success;
  }
}

export class StdOutgoingQuickReply {
  format: OutgoingMessageFormat.quickReplies;

  message: {
    text: string;
    quickReplies: StdQuickReply[];
  };

  constructor(text: string, quickReplies: StdQuickReply[]) {
    this.format = OutgoingMessageFormat.quickReplies;
    this.message = {
      text,
      quickReplies,
    };
  }
}
