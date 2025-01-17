/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { AttachmentCreateDto } from '@/attachment/dto/attachment.dto';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '@/attachment/types';

export const attachmentFixtures: AttachmentCreateDto[] = [
  {
    name: 'store1.jpg',
    type: 'image/jpeg',
    size: 3539,
    location: '39991e51-55c6-4a26-9176-b6ba04f180dc.jpg',
    channel: {
      'web-channel': {
        id: '1',
      },
    },
    resourceRef: AttachmentResourceRef.ContentAttachment,
    access: AttachmentAccess.Public,
    createdByRef: AttachmentCreatedByRef.User,
    createdBy: '9'.repeat(24),
  },
  {
    name: 'store2.jpg',
    type: 'image/jpeg',
    size: 3539,
    location: '39991e51-55c6-4a26-9176-b6ba04f180dd.jpg',
    channel: {
      'web-channel': {
        id: '2',
      },
    },
    resourceRef: AttachmentResourceRef.ContentAttachment,
    access: AttachmentAccess.Public,
    createdByRef: AttachmentCreatedByRef.User,
    createdBy: '9'.repeat(24),
  },
];

export const installAttachmentFixtures = async () => {
  const Attachment = mongoose.model(
    AttachmentModel.name,
    AttachmentModel.schema,
  );
  return await Attachment.insertMany(attachmentFixtures);
};
