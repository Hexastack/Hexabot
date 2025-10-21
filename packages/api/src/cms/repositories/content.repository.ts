/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
  UpdateEvent,
} from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Content,
  ContentDtoConfig,
  ContentFull,
  ContentTransformerDto,
} from '../dto/content.dto';
import { ContentOrmEntity } from '../entities/content.entity';

@EventSubscriber()
@Injectable()
export class ContentRepository
  extends BaseOrmRepository<
    ContentOrmEntity,
    ContentTransformerDto,
    ContentDtoConfig
  >
  implements EntitySubscriberInterface<ContentOrmEntity>
{
  constructor(
    @InjectRepository(ContentOrmEntity)
    repository: Repository<ContentOrmEntity>,
  ) {
    super(repository, ['contentType'], {
      PlainCls: Content,
      FullCls: ContentFull,
    });
  }

  listenTo() {
    return ContentOrmEntity;
  }

  async beforeInsert(event: InsertEvent<ContentOrmEntity>): Promise<void> {
    if (!event.entity) {
      return;
    }

    this.applyDynamicFieldsTransformation(event.entity);
  }

  async beforeUpdate(event: UpdateEvent<ContentOrmEntity>): Promise<void> {
    const entity = event.entity as DeepPartial<ContentOrmEntity> | undefined;

    if (!entity) {
      return;
    }

    this.applyDynamicFieldsTransformation(entity);
  }

  /**
   * Performs a full-text search on the `Content` entity based on the provided query string.
   * The search is case-insensitive.
   *
   * @param query - The text query string to search for.
   * @returns A promise that resolves to the matching content entities.
   */
  async textSearch(query: string): Promise<ContentOrmEntity[]> {
    const pattern = `%${query}%`;

    return await this.repository
      .createQueryBuilder('content')
      .where('LOWER(content.title) LIKE LOWER(:pattern)', { pattern })
      .orWhere('LOWER(content.rag) LIKE LOWER(:pattern)', { pattern })
      .getMany();
  }

  /**
   * Converts the provided object to a string representation, joining each key-value pair
   * with a newline character.
   *
   * @param obj - The object to be stringified.
   *
   * @returns The string representation of the object.
   */
  private stringify(obj: Record<string, any>): string {
    return Object.entries(obj).reduce(
      (prev, cur) => `${prev}\n${cur[0]} : ${cur[1]}`,
      '',
    );
  }

  private applyDynamicFieldsTransformation(
    target: DeepPartial<ContentOrmEntity>,
  ): void {
    const dynamicFields = target.dynamicFields ?? {};
    target.rag = this.stringify(dynamicFields);
  }
}
