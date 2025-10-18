/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { ContentElement } from '@/chat/schemas/types/message';
import { config } from '@/config';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { ContentTypeOrmEntity } from './content-type.entity';

@Entity({ name: 'contents' })
@Index(['title'])
@Index(['rag'])
export class ContentOrmEntity extends BaseOrmEntity {
  /**
   * The content type of this content.
   */
  @Column({ name: 'entity' })
  entity!: string;

  @ManyToOne(
    () => ContentTypeOrmEntity,
    (contentType) => contentType.contents,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'entity' })
  contentType?: ContentTypeOrmEntity;

  /**
   * The title of the content.
   */
  @Column()
  title!: string;

  /**
   * Either of not this content is active.
   */
  @Column({ default: true })
  status!: boolean;

  @Column({ name: 'dynamic_fields', type: 'simple-json', nullable: true })
  dynamicFields!: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  rag?: string | null;

  /**
   * Helper to return the internal url of this content.
   */
  static getUrl(item: ContentElement): string {
    return new URL('/content/view/' + item.id, config.apiBaseUrl).toString();
  }

  /**
   * Helper that returns the relative chatbot payload for this content.
   */
  static getPayload(item: ContentElement): string {
    return 'postback' in item ? (item.postback as string) : item.title;
  }

  /**
   * Converts a content object to an element (A flat representation of a content)
   *
   * @param content
   * @returns An object that has all dynamic fields accessible at top level
   */
  static toElement(content: ContentOrmEntity): ContentElement {
    return {
      id: content.id,
      title: content.title,
      ...(content.dynamicFields ?? {}),
    };
  }
}
