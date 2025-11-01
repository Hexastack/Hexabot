/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { SettingService } from '@/setting/services/setting.service';
import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { DtoTransformer } from '@/utils/types/dto.types';

import { DEFAULT_BLOCK_SEARCH_LIMIT } from '../constants/block';
import {
  Block,
  BlockDtoConfig,
  BlockFull,
  BlockTransformerDto,
  SearchRankedBlock,
} from '../dto/block.dto';
import { BlockOrmEntity } from '../entities/block.entity';

@Injectable()
export class BlockRepository extends BaseOrmRepository<
  BlockOrmEntity,
  BlockTransformerDto,
  BlockDtoConfig
> {
  constructor(
    @InjectRepository(BlockOrmEntity)
    repository: Repository<BlockOrmEntity>,
    private readonly settingService: SettingService,
  ) {
    super(
      repository,
      [
        'trigger_labels',
        'assign_labels',
        'nextBlocks',
        'attachedBlock',
        'category',
        'previousBlocks',
        'attachedToBlock',
      ],
      {
        PlainCls: Block,
        FullCls: BlockFull,
      },
    );

    BlockOrmEntity.registerSettingServiceProvider(() => this.settingService);
  }

  /**
   * Performs a full-text search on blocks using a case-insensitive LIKE pattern.
   *
   * @param query    - Text to search for.
   * @param limit    - Maximum number of results to return.
   * @param category - Optional category filter.
   */
  async search(
    query: string,
    limit = DEFAULT_BLOCK_SEARCH_LIMIT,
    category?: string,
  ): Promise<SearchRankedBlock[]> {
    const sanitized = query?.trim();
    if (!sanitized) {
      return [];
    }

    const cappedLimit = Math.min(
      Math.max(1, limit ?? DEFAULT_BLOCK_SEARCH_LIMIT),
      DEFAULT_BLOCK_SEARCH_LIMIT,
    );

    const pattern = `%${this.escapeLikePattern(sanitized)}%`;

    try {
      const driverType = this.repository.manager.connection.options?.type as
        | string
        | undefined;
      const likeOperator =
        driverType &&
        ['sqlite', 'better-sqlite3', 'capacitor'].includes(driverType)
          ? 'LIKE'
          : 'ILIKE';

      const qb = this.repository
        .createQueryBuilder('block')
        .where(
          new Brackets((where) => {
            where
              .where(`block.name ${likeOperator} :pattern`, { pattern })
              .orWhere(`CAST(block.message AS TEXT) ${likeOperator} :pattern`, {
                pattern,
              })
              .orWhere(`CAST(block.options AS TEXT) ${likeOperator} :pattern`, {
                pattern,
              });
          }),
        )
        .orderBy('block.created_at', 'DESC')
        .limit(cappedLimit);

      if (category) {
        qb.andWhere('block.category_id = :category', { category });
      }

      const entities = await qb.getMany();
      const toDto = this.getTransformer(DtoTransformer.PlainCls);

      return entities.map((entity, index) => {
        const dto = toDto(entity) as Block;
        const score = entities.length - index;
        return Object.assign(new SearchRankedBlock(), dto, { score });
      });
    } catch (error) {
      this.logger?.error('Block search failed', error);
      throw error;
    }
  }

  /**
   * Finds blocks referencing the provided context variable inside `capture_vars`.
   *
   * @param name Context variable unique name.
   */
  async findByContextVarName(name: string): Promise<Block[]> {
    if (!name) {
      return [];
    }

    const toDto = this.getTransformer(DtoTransformer.PlainCls);

    const driverType = (
      this.repository.manager.connection.options?.type ?? ''
    ).toString();

    const qb = this.repository.createQueryBuilder('block');

    if (['sqlite', 'better-sqlite3', 'capacitor'].includes(driverType)) {
      qb.where(
        `EXISTS (
            SELECT 1
            FROM json_each(block.capture_vars) AS elem
            WHERE json_extract(elem.value, '$.context_var') = :name
          )`,
        { name },
      );
    } else {
      qb.where(
        `EXISTS (
            SELECT 1
            FROM jsonb_array_elements(block.capture_vars::jsonb) AS elem
            WHERE elem->>'context_var' = :name
          )`,
        { name },
      );
    }

    const entities = await qb.getMany();

    return entities.map(toDto);
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[%_]/g, '\\$&');
  }
}
