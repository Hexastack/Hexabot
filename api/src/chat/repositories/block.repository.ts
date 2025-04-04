/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Document,
  Model,
  Query,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { BlockCreateDto, BlockDto, BlockUpdateDto } from '../dto/block.dto';
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
  BlockFull,
  BlockDto
> {
  constructor(@InjectModel(Block.name) readonly model: Model<Block>) {
    super(model, Block, BLOCK_POPULATE, BlockFull);
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
      this.logger?.error(
        'NOTE: `url` payload has been deprecated in favor of `id`',
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

    if (update?.category) {
      const movedBlock = await this.findOne(criteria);

      if (!movedBlock) {
        return;
      }

      // Find and update blocks that reference the moved block
      await this.updateMany(
        { nextBlocks: movedBlock.id },
        { $pull: { nextBlocks: movedBlock.id } },
      );

      await this.updateMany(
        { attachedBlock: movedBlock.id },
        { $set: { attachedBlock: null } },
      );
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
    const categoryId: string = updates.$set.category;
    if (categoryId) {
      const movedBlocks = await this.find(criteria);

      if (movedBlocks.length) {
        const ids: string[] = movedBlocks.map(({ id }) => id);

        // Step 1: Map IDs and Category
        const objIds = ids.map((id) => new Types.ObjectId(id));
        const objCategoryId = new Types.ObjectId(categoryId);

        // Step 2: Find other blocks
        const otherBlocks = await this.find({
          _id: { $nin: objIds },
          category: { $ne: objCategoryId },
          $or: [
            { attachedBlock: { $in: objIds } },
            { nextBlocks: { $in: objIds } },
          ],
        });
        // Step 3: Update blocks in the provided scope
        await this.prepareBlocksInCategoryUpdateScope(categoryId, ids);

        // Step 4: Update external blocks
        await this.prepareBlocksOutOfCategoryUpdateScope(otherBlocks, ids);
      }
    }
  }

  /**
   * Updates blocks within a specified category scope.
   * Ensures nextBlocks and attachedBlock are consistent with the provided IDs and category.
   *
   * @param category - The category
   * @param ids - IDs representing the blocks to update.
   * @returns A promise that resolves once all updates within the scope are complete.
   */
  async prepareBlocksInCategoryUpdateScope(
    category: string,
    ids: string[],
  ): Promise<void> {
    for (const id of ids) {
      const oldState = await this.findOne(id);
      if (oldState && oldState.category !== category) {
        const updatedNextBlocks = oldState.nextBlocks?.filter((nextBlock) =>
          ids.includes(nextBlock),
        );

        const updatedAttachedBlock = ids.includes(oldState.attachedBlock || '')
          ? oldState.attachedBlock
          : null;

        await this.updateOne(id, {
          nextBlocks: updatedNextBlocks,
          attachedBlock: updatedAttachedBlock,
        });
      }
    }
  }

  /**
   * Updates blocks outside the specified category scope by removing references to the provided IDs.
   * Handles updates to both attachedBlock and nextBlocks.
   *
   * @param otherBlocks - An array of blocks outside the provided category scope.
   * @param ids - An array of the Ids to disassociate.
   * @returns A promise that resolves once all external block updates are complete.
   */
  async prepareBlocksOutOfCategoryUpdateScope(
    otherBlocks: Block[],
    ids: string[],
  ): Promise<void> {
    for (const block of otherBlocks) {
      if (block.attachedBlock && ids.includes(block.attachedBlock)) {
        await this.updateOne(block.id, { attachedBlock: null });
      }

      const nextBlocks = block.nextBlocks?.filter(
        (nextBlock) => !ids.includes(nextBlock),
      );

      if (nextBlocks?.length) {
        await this.updateOne(block.id, { nextBlocks });
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
