/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Content,
  ContentDtoConfig,
  ContentFull,
  ContentTransformerDto,
} from '../dto/content.dto';
import { ContentOrmEntity } from '../entities/content.entity';

@Injectable()
export class ContentRepository extends BaseOrmRepository<
  ContentOrmEntity,
  ContentTransformerDto,
  ContentDtoConfig
> {
  constructor(
    @InjectRepository(ContentOrmEntity)
    repository: Repository<ContentOrmEntity>,
  ) {
    super(repository, ['contentType'], {
      PlainCls: Content,
      FullCls: ContentFull,
    });
  }

  protected override async preCreate(
    entity: DeepPartial<ContentOrmEntity> | ContentOrmEntity,
  ): Promise<void> {
    const parsedEntity = entity as DeepPartial<ContentOrmEntity>;
    const dynamicFields =
      (parsedEntity.dynamicFields as Record<string, any> | undefined) ?? {};

    if (typeof dynamicFields === 'object') {
      parsedEntity.dynamicFields = dynamicFields;
      parsedEntity.rag = this.stringify(dynamicFields);
    }
  }

  protected override async preUpdate(
    _current: ContentOrmEntity,
    changes: DeepPartial<ContentOrmEntity>,
  ): Promise<void> {
    if ('dynamicFields' in changes) {
      const dynamicFields =
        (changes.dynamicFields as Record<string, any> | undefined) ?? {};
      changes.dynamicFields = dynamicFields;
      changes.rag = this.stringify(dynamicFields);
    }
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
}
