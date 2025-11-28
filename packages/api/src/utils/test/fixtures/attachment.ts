/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { AttachmentCreateDto } from '@/attachment/dto/attachment.dto';
import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '@/attachment/types';
import { UserOrmEntity } from '@/user/entities/user.entity';

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
    createdBy: '66666666-6666-6666-6666-666666666666',
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
    createdBy: '66666666-6666-6666-6666-666666666666',
  },
];

export const installAttachmentFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const userRepository = dataSource.getRepository(UserOrmEntity);
  const repository = dataSource.getRepository(AttachmentOrmEntity);
  const user = await userRepository.findOne({
    where: { username: 'admin' },
  });
  const entities = repository.create(
    attachmentFixtures.map((a) => ({
      ...a,
      createdBy: user,
    })),
  );
  await repository.save(entities);
};
