/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmRepository } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
}
