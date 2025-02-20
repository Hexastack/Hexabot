/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  OutgoingMessageFormat,
  stdOutgoingTextEnvelopeSchema,
  StdOutgoingTextMessage,
} from '@/chat/schemas/types/message';

export class StdOutgoingTextEnvelopeBuilder {
  constructor() {}

  private text: string;

  public setText(text: string): this {
    this.text = text;
    return this;
  }

  build() {
    const stdOutgoingTextEnvelope = new StdOutgoingText(this.text);
    if (this.isValid(stdOutgoingTextEnvelope)) {
      return stdOutgoingTextEnvelope;
    }
    throw new Error('Invalid stdOutgoingTextEnvelope shape');
  }

  private isValid(data: unknown) {
    return stdOutgoingTextEnvelopeSchema.safeParse(data).success;
  }
}

export class StdOutgoingText {
  format: OutgoingMessageFormat.text;

  message: StdOutgoingTextMessage;

  constructor(text: string) {
    this.format = OutgoingMessageFormat.text;
    this.message = { text };
  }
}
