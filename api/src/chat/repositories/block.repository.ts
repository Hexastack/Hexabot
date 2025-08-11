/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ConflictException, Injectable } from '@nestjs/common';
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
import { ConversationRepository } from '../repositories/conversation.repository';
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
  constructor(
    @InjectModel(Block.name) readonly model: Model<Block>,
    private readonly conversationRepository: ConversationRepository,
  ) {
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
    const targetCategoryId: string = updates.$set.category;
    if (targetCategoryId) {
      const blocksToMove = await this.find(criteria);

      if (blocksToMove.length) {
        const blocksToMoveIds: string[] = blocksToMove.map(({ id }) => id);

        // Step 1: Map IDs and Category
        const movedBlocksobjIds = blocksToMoveIds.map(
          (id) => new Types.ObjectId(id),
        );
        const sourceCategoryId = blocksToMove[0].category;

        // Step 2: Find blocks in source category that reference the moved blocks
        const linkedBlocks = await this.find({
          _id: { $nin: movedBlocksobjIds },
          category: sourceCategoryId,
          $or: [
            { attachedBlock: { $in: movedBlocksobjIds } },
            { nextBlocks: { $in: movedBlocksobjIds } },
          ],
        });
        // Step 3: Update blocks in the provided scope
        await this.prepareBlocksInCategoryUpdateScope(
          targetCategoryId,
          blocksToMoveIds,
        );

        // Step 4: Update blocks in source category
        await this.prepareBlocksOutOfCategoryUpdateScope(
          linkedBlocks,
          blocksToMoveIds,
        );
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
    const blocks = await this.find({
      _id: { $in: ids },
      category: { $ne: category },
    });

    for (const { id, nextBlocks, attachedBlock } of blocks) {
      try {
        const updatedNextBlocks = nextBlocks.filter((nextBlock) =>
          ids.includes(nextBlock),
        );

        const updatedAttachedBlock = ids.includes(attachedBlock || '')
          ? attachedBlock
          : null;

        const updates: Partial<Block> = {
          nextBlocks: updatedNextBlocks,
          attachedBlock: updatedAttachedBlock,
        };

        await this.updateOne(id, updates);
      } catch (error) {
        this.logger?.error(
          `Failed to update block ${id} during in-category scope update.`,
          error,
        );
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
      try {
        if (ids.includes(block.id)) continue;
        const updates: Partial<Block> = {};

        // Check if the block has an attachedBlock
        if (block.attachedBlock && ids.includes(block.attachedBlock)) {
          updates.attachedBlock = null;
        } else {
          // Only check nextBlocks if there is no attachedBlock
          const filteredNextBlocks = block.nextBlocks?.filter(
            (nextBlock) => !ids.includes(nextBlock),
          );

          if (filteredNextBlocks?.length !== block.nextBlocks?.length) {
            updates.nextBlocks = filteredNextBlocks || [];
          }
        }

        if (Object.keys(updates).length > 0) {
          await this.updateOne(block.id, updates);
        }
      } catch (error) {
        this.logger?.error(
          `Failed to update block ${block.id} during out-of-category scope update.`,
          error,
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
      // Check if any active conversation references this block in current or next
      const inUse = await this.conversationRepository.model.exists({
        active: true,
        $or: [
          { current: { $in: idsToDelete } },
          { next: { $in: idsToDelete } },
        ],
      });
      if (inUse) {
        throw new ConflictException(
          'Cannot delete block: it is currently used by an active conversation.',
        );
      }

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
