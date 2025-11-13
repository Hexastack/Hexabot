/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { config } from '@hexabot/config';
import { BaseOrmEntity, EnumColumn, JsonColumn } from '@hexabot/core/database';
import { Expose } from 'class-transformer';
import { Column, Entity, Index } from 'typeorm';

import { ChannelName } from '@/channel/types';
import { FileType } from '@/chat/types/attachment';
import { buildURL } from '@/utils/helpers/URL';

import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '../types';

@Entity({ name: 'attachments' })
@Index('idx_attachment_resource_ref', ['resourceRef'])
export class AttachmentOrmEntity extends BaseOrmEntity {
  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column({ type: 'integer' })
  size!: number;

  @Column({ unique: true })
  location!: string;

  @JsonColumn({ nullable: true })
  channel?: Partial<Record<ChannelName, any>>;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy?: string | null;

  @EnumColumn({
    name: 'created_by_ref',
    enum: AttachmentCreatedByRef,
    nullable: true,
  })
  createdByRef?: AttachmentCreatedByRef;

  @EnumColumn({
    name: 'resource_ref',
    enum: AttachmentResourceRef,
  })
  resourceRef!: AttachmentResourceRef;

  @EnumColumn({ enum: AttachmentAccess })
  access!: AttachmentAccess;

  @Expose()
  get url(): string {
    if (!this.id || !this.name) {
      return '';
    }

    return AttachmentOrmEntity.getAttachmentUrl(this.id, this.name);
  }

  static getAttachmentUrl(
    attachmentId: string,
    attachmentName: string = '',
  ): string {
    return buildURL(
      config.apiBaseUrl,
      `/attachment/download/${attachmentId}/${attachmentName}`,
    );
  }

  static getTypeByMime(mimeType: string): FileType {
    if (mimeType.startsWith(FileType.image)) {
      return FileType.image;
    } else if (mimeType.startsWith(FileType.audio)) {
      return FileType.audio;
    } else if (mimeType.startsWith(FileType.video)) {
      return FileType.video;
    } else {
      return FileType.file;
    }
  }
}
