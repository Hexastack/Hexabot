/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Button } from '@/chat/schemas/types/button';
import { OutgoingMessageFormat } from '@/chat/schemas/types/message';

import { stdOutgoingButtonsEnvelopeSchema } from './../../../chat/schemas/types/message';

export class StdOutgoingButtonsEnvelopeBuilder {
  private format: OutgoingMessageFormat.buttons = OutgoingMessageFormat.buttons;

  private text: string;

  private buttons: Button[] = [];

  constructor() {}

  setText(text: string) {
    this.text = text;
    return this;
  }

  addButton(button: Button) {
    this.buttons.push(button);
    return this;
  }

  build() {
    const stdOutgoingButton = new StdOutgoingButton(this.text, this.buttons);
    if (this.isValid(stdOutgoingButton)) {
      return stdOutgoingButton;
    }
    throw new Error('Invalid StdOutgoingButton shape');
  }

  private isValid(data: unknown) {
    return stdOutgoingButtonsEnvelopeSchema.safeParse(data).success;
  }
}

export class StdOutgoingButton {
  format: OutgoingMessageFormat.buttons;

  message: {
    text: string;
    buttons: Button[];
  };

  constructor(text: string, buttons: Button[]) {
    this.format = OutgoingMessageFormat.buttons;
    this.message = {
      text,
      buttons,
    };
  }
}
