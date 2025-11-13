/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmService } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';

import { Block, BlockFull } from '../dto/block.dto';
import {
  ContextVar,
  ContextVarDtoConfig,
  ContextVarTransformerDto,
} from '../dto/context-var.dto';
import { ContextVarOrmEntity } from '../entities/context-var.entity';
import { ContextVarRepository } from '../repositories/context-var.repository';

@Injectable()
export class ContextVarService extends BaseOrmService<
  ContextVarOrmEntity,
  ContextVarTransformerDto,
  ContextVarDtoConfig
> {
  constructor(readonly repository: ContextVarRepository) {
    super(repository);
  }

  /**
   * Retrieves a mapping of context variable names to their corresponding `ContextVar` objects for a given block.
   *
   * @param {Block | BlockFull} block - The block containing the capture variables to retrieve context variables for.
   * @returns {Promise<Record<string, ContextVar>>} A promise that resolves to a record mapping context variable names to `ContextVar` objects.
   */
  async getContextVarsByBlock(
    block: Block | BlockFull,
  ): Promise<Record<string, ContextVar>> {
    const captureVarNames =
      block.capture_vars?.map(({ context_var }) => context_var) ?? [];

    if (!captureVarNames.length) {
      return {};
    }

    const vars = await this.find({
      where: { name: In(captureVarNames) },
    });

    return vars.reduce<Record<string, ContextVar>>((acc, cv) => {
      acc[cv.name] = cv;

      return acc;
    }, {});
  }
}
