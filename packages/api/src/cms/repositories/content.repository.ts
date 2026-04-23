/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ContentFull } from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { ContentOrmEntity } from '../entities/content.entity';

@Injectable()
export class ContentRepository extends BaseOrmRepository<ContentOrmEntity> {
  constructor(
    @InjectRepository(ContentOrmEntity)
    repository: Repository<ContentOrmEntity>,
  ) {
    super(repository, ['contentType']);
  }

  /**
   * Performs a full-text search on the `Content` entity based on the provided query string.
   * The search is case-insensitive.
   *
   * @param query - The text query string to search for.
   * @returns A promise that resolves to the matching content entities.
   */
  async textSearch(
    query: string,
    options?: {
      status?: boolean;
      contentTypeId?: string;
      limit?: number;
    },
  ): Promise<ContentFull[]> {
    const pattern = `%${query}%`;
    const queryBuilder = this.repository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.contentType', 'contentType')
      .where(
        "(LOWER(content.title) LIKE LOWER(:pattern) OR LOWER(COALESCE(content.searchText, '')) LIKE LOWER(:pattern))",
        { pattern },
      );

    if (typeof options?.status === 'boolean') {
      queryBuilder.andWhere('content.status = :status', {
        status: options.status,
      });
    }

    if (options?.contentTypeId) {
      queryBuilder.andWhere('contentType.id = :contentTypeId', {
        contentTypeId: options.contentTypeId,
      });
    }

    if (typeof options?.limit === 'number' && options.limit > 0) {
      queryBuilder.take(options.limit);
    }

    const results = await queryBuilder.getMany();

    return results.map((content) => content.toFullCls());
  }
}
