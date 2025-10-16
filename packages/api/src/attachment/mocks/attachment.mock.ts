/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Stream } from 'node:stream';

import { Attachment } from '@/attachment/entities/attachment.entity';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '../types';

const baseAttachment = {
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
} satisfies Partial<Attachment>;

export const attachment: Attachment = Object.assign(
  new Attachment(),
  baseAttachment,
);

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
  Object.assign(new Attachment(), {
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
  }),
  Object.assign(new Attachment(), {
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
  }),
];
