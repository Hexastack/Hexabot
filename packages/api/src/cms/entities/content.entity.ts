/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { config } from '@hexabot/config';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { ContentElement } from '@/chat/types/message';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { Content } from '../dto/content.dto';

import { ContentTypeOrmEntity } from './content-type.entity';

@Entity({ name: 'contents' })
@Index(['title'])
@Index(['rag'])
export class ContentOrmEntity extends BaseOrmEntity {
  /**
   * The content type of this content.
   */
  @ManyToOne(() => ContentTypeOrmEntity, (entity) => entity.contents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_type_id' })
  @AsRelation()
  contentType!: ContentTypeOrmEntity;

  @RelationId((value: ContentOrmEntity) => value.contentType)
  private readonly contentTypeId!: string;

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

  @JsonColumn({ name: 'dynamic_fields', nullable: true })
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
  static toElement(content: Content): ContentElement {
    return {
      id: content.id,
      title: content.title,
      ...(content.dynamicFields ?? {}),
    };
  }

  @BeforeInsert()
  @BeforeUpdate()
  applyDynamicFieldsTransformation(): void {
    const dynamicFields = this.dynamicFields ?? {};
    this.rag = this.stringifyDynamicFields(dynamicFields);
  }

  private stringifyDynamicFields(obj: Record<string, any>): string {
    return Object.entries(obj).reduce(
      (prev, cur) => `${prev}\n${cur[0]} : ${cur[1]}`,
      '',
    );
  }
}
