/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Attachment } from '@/attachment/schemas/attachment.schema';

export enum FileType {
  image = 'image',
  video = 'video',
  audio = 'audio',
  file = 'file',
  unknown = 'unknown',
}

export type AttachmentForeignKey = {
  attachment_id: string;
  /** @deprecated use attachment_id field instead */
  url?: string;
};

export type WithUrl<A> = A & { url?: string };

export interface AttachmentPayload<
  A extends WithUrl<Attachment> | AttachmentForeignKey,
> {
  type: FileType;
  payload: A;
}

export interface IncomingAttachmentPayload {
  type: FileType;
  payload: {
    attachment_id: string;
    /** @deprecated use attachment_id field instead */
    url?: string;
  };
}
