/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createRequire } from 'node:module';

import {
  contentSchema,
  contentFullSchema,
  Content,
  ContentElement,
} from '@hexabot-ai/types';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { AuditLabel } from '@/audit/decorators/audit-label.decorator';
import { config } from '@/config';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import {
  OnBeforeInsert,
  OnBeforeUpdate,
} from '@/database/decorators/orm-event-hooks.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { ContentDto } from '../dto/content.dto';

import type { ContentTypeOrmEntity } from './content-type.entity';

const requireEntity = createRequire(__filename);

@Entity({ name: 'contents' })
@Index(['title'])
@Index(['searchText'])
export class ContentOrmEntity extends BaseOrmEntity<ContentDto> {
  plainCls = contentSchema;

  fullCls = contentFullSchema;

  /**
   * The content type of this content.
   */
  @ManyToOne(
    () => requireEntity('./content-type.entity').ContentTypeOrmEntity,
    (entity: ContentTypeOrmEntity) => entity.contents,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'content_type_id' })
  @AsRelation()
  contentType!: ContentTypeOrmEntity;

  @RelationId((value: ContentOrmEntity) => value.contentType)
  private readonly contentTypeId!: string;

  /**
   * The title of the content.
   */
  @AuditLabel()
  @Column()
  title!: string;

  /**
   * Either of not this content is active.
   */
  @Column({ default: true })
  status!: boolean;

  @JsonColumn({ name: 'properties', nullable: true })
  properties!: Record<string, any> | null;

  @Column({ name: 'searchText', type: 'text', nullable: false })
  searchText: string;

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
   * @returns An object that has all content properties accessible at top level
   */
  static toElement(content: Content): ContentElement {
    return {
      id: content.id,
      title: content.title,
      ...(content.properties ?? {}),
    };
  }

  @OnBeforeInsert()
  @OnBeforeUpdate()
  async applySearchTextTransformation(): Promise<void> {
    this.searchText = await this.buildSearchText();
  }

  async buildSearchText(): Promise<string> {
    const lines = [`title: ${this.title}`];
    const properties = this.properties ?? {};

    for (const [key, value] of Object.entries(properties)) {
      if (typeof value !== 'string') {
        continue;
      }

      lines.push(`${key}: ${value}`);
    }

    return lines.join('\n');
  }
}
