/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import blockSchema, { Block } from '@/chat/schemas/block.schema';

import { MigrationServices } from '../types';

module.exports = {
  async up(services: MigrationServices) {
    // Migration logic
    const BlockModel = mongoose.model<Block>(Block.name, blockSchema);

    // Drop index if exists
    try {
      const indexes = await BlockModel.collection.indexes();
      const hasIdx = indexes.some((i) => i.name === 'block_search_index');
      if (hasIdx) {
        await BlockModel.collection.dropIndex('block_search_index');
      }
    } catch (e) {
      services.logger.log(
        'block_search_index does not exist or failed to drop, continuing',
        e,
      );
    }

    // Create index with language-agnostic setting
    try {
      await BlockModel.collection.createIndex(
        {
          name: 'text',
          message: 'text',
          'message.text': 'text',
          'options.fallback.message': 'text',
          'message.args': 'text',
        },
        {
          weights: {
            name: 5,
            message: 2,
            'message.text': 2,
            'message.args': 2,
            'options.fallback.message': 1,
          },
          name: 'block_search_index',
          default_language: 'none',
        },
      );
      services.logger.verbose('Created block_search_index successfully');
      return true;
    } catch (err) {
      services.logger.error('Failed to create block_search_index', err as any);
      return false;
    }
  },

  async down(services: MigrationServices) {
    // Rollback logic
    const BlockModel = mongoose.model<Block>(Block.name, blockSchema);
    // check if index exists
    try {
      const indexes = await BlockModel.collection.indexes();
      const hasIdx = indexes.some((i) => i.name === 'block_search_index');
      if (!hasIdx) {
        services.logger.warn(
          'block_search_index is already dropped. Aborting rollback.',
        );
        return false;
      }

      // Index exists - attempt to drop
      await BlockModel.collection.dropIndex('block_search_index');
      services.logger.verbose('Dropped block_search_index successfully');
      return true;
    } catch (e) {
      // Drop failed — log error and fail the rollback
      services.logger.error('Failed to drop block_search_index', e);
      return false;
    }
  },
};
