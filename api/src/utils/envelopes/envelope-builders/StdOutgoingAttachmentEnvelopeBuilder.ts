/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FileType } from '@/chat/schemas/types/attachment';
import {
  OutgoingMessageFormat,
  stdOutgoingAttachmentEnvelopeSchema,
} from '@/chat/schemas/types/message';
import { StdQuickReply } from '@/chat/schemas/types/quick-reply';

export class StdOutgoingAttachmentEnvelopeBuilder {
  private fileType: FileType;

  private attachmentId: string;

  private attachmentUrl: string;

  private quickReplies: StdQuickReply[] = [];

  constructor() {}

  setFileType(fileType: FileType) {
    this.fileType = fileType;
    return this;
  }

  setAttachmentId(id: string) {
    this.attachmentId = id;
    return this;
  }

  setAttachmentUrl(url: string) {
    this.attachmentUrl = url;
    return this;
  }

  buildAndAppendQuickReply(quickReply: StdQuickReply) {
    this.quickReplies.push(quickReply);
    return this;
  }

  build() {
    //todo: verify why id can be null
    let payload: { id: string } | { url: string };
    if (this.attachmentUrl) {
      payload = { url: this.attachmentUrl };
    } else {
      payload = { id: this.attachmentId };
    }
    const stdOutgoingAttachmentEnvelope = new StdOutgoingAttachmentEnvelope(
      this.fileType,
      payload,
      this.quickReplies,
    );
    if (this.isValid(stdOutgoingAttachmentEnvelope)) {
      return stdOutgoingAttachmentEnvelope;
    }

    throw new Error('Invalid stdOutgoingAttachmentEnvelope shape');
  }

  private isValid(data: unknown) {
    return stdOutgoingAttachmentEnvelopeSchema.safeParse(data).success;
  }
}

export class StdOutgoingAttachmentEnvelope {
  format: OutgoingMessageFormat.attachment;

  message: {
    attachment: {
      //todo: verify why id can be null
      payload: { id: string } | { url: string };
      type: FileType;
    };
    quickReplies?: StdQuickReply[];
  };

  constructor(
    fileType: FileType,
    //todo: verify why id can be null
    payload: { id: string } | { url: string },
    quickReplies?: StdQuickReply[],
  ) {
    this.format = OutgoingMessageFormat.attachment;
    this.message = {
      attachment: {
        payload,
        type: fileType,
      },
    };

    if (quickReplies?.length) {
      this.message.quickReplies = quickReplies;
    }
  }
}
