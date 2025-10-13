/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { ContextVarDto } from '../dto/context-var.dto';
import { ContextVar } from '../schemas/context-var.schema';
import { BlockService } from '../services/block.service';

@Injectable()
export class ContextVarRepository extends BaseRepository<
  ContextVar,
  never,
  never,
  ContextVarDto
> {
  constructor(
    @InjectModel(ContextVar.name) readonly model: Model<ContextVar>,
    private readonly blockService: BlockService,
  ) {
    super(model, ContextVar);
  }

  /**
   * Pre-processing logic before deleting a context var.
   * It avoids deleting a context var if its unique name is used in blocks within the capture_vars array.
   * If the context var is found in blocks, the block IDs are returned in the exception message.
   *
   * @param query - The delete query.
   * @param criteria - The filter criteria for finding context vars to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<ContextVar, any, any>,
      unknown,
      ContextVar,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<ContextVar>,
  ) {
    const ids = Array.isArray(criteria._id) ? criteria._id : [criteria._id];

    for (const id of ids) {
      const contextVar = await this.findOne({ _id: id });
      if (!contextVar) {
        throw new NotFoundException(`Context var with ID ${id} not found.`);
      }

      const associatedBlocks = await this.blockService.find({
        capture_vars: { $elemMatch: { context_var: contextVar.name } },
      });

      if (associatedBlocks?.length > 0) {
        const blockNames = associatedBlocks
          .map((block) => block.name)
          .join(', ');
        throw new ForbiddenException(
          `Context var "${contextVar.name}" is associated with the following block(s): ${blockNames} and cannot be deleted.`,
        );
      }
    }
  }
}
