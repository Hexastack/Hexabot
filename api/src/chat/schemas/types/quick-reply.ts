/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { IncomingAttachmentPayload } from './attachment';
import { PayloadType } from './message';

export type Payload =
  | {
      type: PayloadType.location;
      coordinates: {
        lat: number;
        lon: number;
      };
    }
  | {
      type: PayloadType.attachments;
      attachments: IncomingAttachmentPayload;
    };

export enum QuickReplyType {
  text = 'text',
  location = 'location',
  user_phone_number = 'user_phone_number',
  user_email = 'user_email',
}

export interface StdQuickReply {
  content_type: QuickReplyType;
  title: string;
  payload: string;
}
