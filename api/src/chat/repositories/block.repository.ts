/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, {
  Document,
  Model,
  Query,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { BlockCreateDto, BlockUpdateDto } from '../dto/block.dto';
import {
  Block,
  BLOCK_POPULATE,
  BlockFull,
  BlockPopulate,
} from '../schemas/block.schema';

@Injectable()
export class BlockRepository extends BaseRepository<
  Block,
  BlockPopulate,
  BlockFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(Block.name) readonly model: Model<Block>,
    @Optional() private readonly logger?: LoggerService,
  ) {
    super(eventEmitter, model, Block, BLOCK_POPULATE, BlockFull);
  }

  /**
   * Checks if the `url` field in the attachment payload is deprecated, and logs an error if found.
   *
   * @param block - The block DTO (create or update) to check.
   */
  checkDeprecatedAttachmentUrl(block: BlockCreateDto | BlockUpdateDto) {
    if (
      block.message &&
      'attachment' in block.message &&
      block.message.attachment.payload &&
      'url' in block.message.attachment.payload
    ) {
      this.logger.error(
        'NOTE: `url` payload has been deprecated in favor of `attachment_id`',
        block.name,
      );
    }
  }

  /**
   * Pre-processing logic for creating a new block.
   *
   * @param doc - The document that is being created.
   */
  async preCreate(
    _doc: Document<unknown, object, Block> & Block & { _id: Types.ObjectId },
  ): Promise<void> {
    if (_doc) this.checkDeprecatedAttachmentUrl(_doc);
  }

  /**
   * Pre-processing logic for updating a block.
   *
   * @param query - The query to update a block.
   * @param criteria - The filter criteria for the update query.
   * @param updates - The update data.
   */
  async preUpdate(
    _query: Query<
      Document<Block, any, any>,
      Document<Block, any, any>,
      unknown,
      Block,
      'findOneAndUpdate'
    >,
    criteria: TFilterQuery<Block>,
    updates:
      | UpdateWithAggregationPipeline
      | UpdateQuery<Document<Block, any, any>>,
  ): Promise<void> {
    const update: BlockUpdateDto = updates?.['$set'];
    if (update?.category && criteria._id) {
      const movedBlockId = criteria._id;

      // Find and update blocks that reference the moved block
      await this.model.updateMany(
        { nextBlocks: movedBlockId },
        { $pull: { nextBlocks: movedBlockId } },
      );

      await this.model.updateMany(
        { attachedBlock: movedBlockId },
        { $set: { attachedBlock: null } },
      );
    } else if (update?.category && !criteria._id) {
      throw new Error('Criteria must include a valid id to update category.');
    }

    this.checkDeprecatedAttachmentUrl(update);
  }

  /**
   * Pre-processing logic for updating blocks.
   *
   * @param query - The query to update blocks.
   * @param criteria - The filter criteria for the update query.
   * @param updates - The update data.
   */
  async preUpdateMany(
    _query: Query<
      Document<Block, any, any>,
      Document<Block, any, any>,
      unknown,
      Block,
      'updateMany',
      Record<string, never>
    >,
    criteria: TFilterQuery<Block>,
    updates: UpdateQuery<Document<Block, any, any>>,
  ): Promise<void> {
    if (criteria._id?.$in && updates?.$set?.category) {
      const ids: string[] = criteria._id?.$in || [];
      const category: string = updates.$set.category;

      // Step 1: Map IDs and Category
      const { objIds, objCategory } = this.mapIdsAndCategory(ids, category);

      // Step 2: Find other blocks
      const otherBlocks = await this.model.find({
        _id: { $nin: objIds },
        category: { $ne: objCategory },
        $or: [
          { attachedBlock: { $in: objIds } },
          { nextBlocks: { $in: objIds } },
        ],
      });

      // Step 3: Update blocks in the provided scope
      await this.updateBlocksInScope(objCategory, ids);

      // Step 4: Update external blocks
      await this.updateExternalBlocks(otherBlocks, objIds);
    }
  }

  mapIdsAndCategory(
    ids: string[],
    category: string,
  ): {
    objIds: mongoose.Types.ObjectId[];
    objCategory: mongoose.Types.ObjectId;
  } {
    const objIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const objCategory = new mongoose.Types.ObjectId(category);
    return { objIds, objCategory };
  }

  async updateBlocksInScope(
    objCategory: mongoose.Types.ObjectId,
    ids: string[],
  ): Promise<void> {
    for (const id of ids) {
      const oldState = await this.model.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      if (oldState.category.toString() !== objCategory.toString()) {
        const updatedNextBlocks = oldState.nextBlocks.filter((nextBlock) =>
          ids.includes(nextBlock.toString()),
        );

        const updatedAttachedBlock = ids.includes(
          oldState.attachedBlock?.toString() || '',
        )
          ? oldState.attachedBlock
          : null;

        await this.model.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          {
            nextBlocks: updatedNextBlocks,
            attachedBlock: updatedAttachedBlock,
          },
        );
      }
    }
  }

  async updateExternalBlocks(
    otherBlocks,
    objIds: Types.ObjectId[],
  ): Promise<void> {
    for (const block of otherBlocks) {
      if (
        objIds.some((id) => id.toString() === block.attachedBlock?.toString())
      ) {
        await this.model.updateOne({ _id: block.id }, { attachedBlock: null });
      }

      const updatedNextBlocks = block.nextBlocks.filter(
        (nextBlock) =>
          !objIds.some((id) => id.toString() === nextBlock.toString()),
      );

      if (updatedNextBlocks.length !== block.nextBlocks.length) {
        await this.model.updateOne(
          { _id: block.id },
          { nextBlocks: updatedNextBlocks },
        );
      }
    }
  }

  /**
   * Post-processing logic after deleting a block.
   *
   * @param query - The delete query.
   * @param result - The result of the delete operation.
   */
  async postDelete(
    _query: Query<
      DeleteResult,
      Document<Block, any, any>,
      unknown,
      Block,
      'deleteOne' | 'deleteMany'
    >,
    result: DeleteResult,
  ) {
    if (result.deletedCount > 0) {
    }
  }

  /**
   * Pre-processing logic before deleting a block.
   * It handles removing references to the block from other related blocks.
   *
   * @param query - The delete query.
   * @param criteria - The filter criteria for finding blocks to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<Block, any, any>,
      unknown,
      Block,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<Block>,
  ) {
    const docsToDelete = await this.model.find(criteria);
    const idsToDelete = docsToDelete.map(({ id }) => id);
    if (idsToDelete.length > 0) {
      // Remove from all other blocks
      await this.model.updateMany(
        { attachedBlock: { $in: idsToDelete } },
        {
          $set: {
            attachedBlock: null,
          },
        },
      );
      // Remove all other previous blocks
      await this.model.updateMany(
        { nextBlocks: { $in: idsToDelete } },
        {
          $pull: {
            nextBlocks: { $in: idsToDelete },
          },
        },
      );
    }
  }
}
