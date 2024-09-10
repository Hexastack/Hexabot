/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  TFilterQuery,
  Model,
  Document,
  Types,
  Query,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';

import { BlockCreateDto, BlockUpdateDto } from '../dto/block.dto';
import { Block, BlockFull } from '../schemas/block.schema';

@Injectable()
export class BlockRepository extends BaseRepository<
  Block,
  | 'trigger_labels'
  | 'assign_labels'
  | 'nextBlocks'
  | 'attachedBlock'
  | 'category'
  | 'previousBlocks'
  | 'attachedToBlock'
> {
  private readonly logger: LoggerService;

  constructor(
    @InjectModel(Block.name) readonly model: Model<Block>,
    @Optional() logger?: LoggerService,
  ) {
    super(model, Block);
    this.logger = logger;
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
    _criteria: TFilterQuery<Block>,
    _updates:
      | UpdateWithAggregationPipeline
      | UpdateQuery<Document<Block, any, any>>,
  ): Promise<void> {
    const updates: BlockUpdateDto = _updates?.['$set'];

    this.checkDeprecatedAttachmentUrl(updates);
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

  /**
   * Finds blocks and populates related fields (e.g., labels, attached blocks).
   *
   * @param filters - The filter criteria for finding blocks.
   *
   * @returns The populated block results.
   */
  async findAndPopulate(filters: TFilterQuery<Block>) {
    const query = this.findQuery(filters).populate([
      'trigger_labels',
      'assign_labels',
      'nextBlocks',
      'attachedBlock',
      'category',
      'previousBlocks',
      'attachedToBlock',
    ]);
    return await this.execute(query, BlockFull);
  }

  /**
   * Finds a single block by ID and populates related fields (e.g., labels, attached blocks).
   *
   * @param id - The ID of the block to find.
   *
   * @returns The populated block result or null if not found.
   */
  async findOneAndPopulate(id: string) {
    const query = this.findOneQuery(id).populate([
      'trigger_labels',
      'assign_labels',
      'nextBlocks',
      'attachedBlock',
      'category',
      'previousBlocks',
      'attachedToBlock',
    ]);
    return await this.executeOne(query, BlockFull);
  }
}
