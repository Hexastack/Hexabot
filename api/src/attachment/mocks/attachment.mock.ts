/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Stream } from 'node:stream';

import { Attachment } from '../schemas/attachment.schema';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '../types';

export const attachment: Attachment = {
  name: 'Screenshot from 2022-03-11 08-41-27-2a9799a8b6109c88fd9a7a690c1101934c.png',
  type: 'image/png',
  size: 343370,
  location:
    '/Screenshot from 2022-03-11 08-41-27-2a9799a8b6109c88fd9a7a690c1101934c.png',
  resourceRef: AttachmentResourceRef.BlockAttachment,
  access: AttachmentAccess.Public,
  id: '65940d115178607da65c82b6',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: '1',
  createdByRef: AttachmentCreatedByRef.User,
};

export const attachmentFile: Express.Multer.File = {
  filename: attachment.name,
  mimetype: attachment.type,
  size: attachment.size,
  buffer: Buffer.from(new Uint8Array([])),
  destination: '',
  fieldname: '',
  originalname: attachment.name,
  path: '',
  stream: new Stream.Readable(),
  encoding: '7bit',
};

export const attachments: Attachment[] = [
  attachment,
  {
    name: 'Screenshot from 2022-03-11 08-41-27-2a9799a8b6109c88fd9a7a690c1101934c.png',
    type: 'image/png',
    size: 343370,
    location:
      '/app/src/attachment/uploads/Screenshot from 2022-03-11 08-41-27-2a9799a8b6109c88fd9a7a690c1101934c.png',
    channel: { ['some-channel']: {} },
    resourceRef: AttachmentResourceRef.BlockAttachment,
    access: AttachmentAccess.Public,
    id: '65940d115178607da65c82b7',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1',
    createdByRef: AttachmentCreatedByRef.User,
  },
  {
    name: 'Screenshot from 2022-03-18 08-58-15-af61e7f71281f9fd3f1ad7ad10107741c.png',
    type: 'image/png',
    size: 33829,
    location:
      '/app/src/attachment/uploads/Screenshot from 2022-03-18 08-58-15-af61e7f71281f9fd3f1ad7ad10107741c.png',
    channel: { ['some-channel']: {} },
    resourceRef: AttachmentResourceRef.BlockAttachment,
    access: AttachmentAccess.Public,
    id: '65940d115178607da65c82b8',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1',
    createdByRef: AttachmentCreatedByRef.User,
  },
];
