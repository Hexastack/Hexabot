/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Stream } from 'node:stream';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';

import { AttachmentCreateDto } from '../dto/attachment.dto';
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
  createdBy: '1',
  createdByRef: AttachmentCreatedByRef.User,
} satisfies Partial<AttachmentCreateDto>;

export const attachment: AttachmentOrmEntity = Object.assign(
  new AttachmentOrmEntity(),
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
