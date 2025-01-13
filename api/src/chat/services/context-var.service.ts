/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { ContextVarDto } from '../dto/context-var.dto';
import { ContextVarRepository } from '../repositories/context-var.repository';
import { Block, BlockFull } from '../schemas/block.schema';
import { ContextVar } from '../schemas/context-var.schema';

@Injectable()
export class ContextVarService extends BaseService<
  ContextVar,
  never,
  never,
  ContextVarDto
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
    const vars = await this.find({
      name: { $in: block.capture_vars.map(({ context_var }) => context_var) },
    });
    return vars.reduce((acc, cv) => {
      acc[cv.name] = cv;
      return acc;
    }, {});
  }
}
