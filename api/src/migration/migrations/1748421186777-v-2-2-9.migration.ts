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

/**
 * Migration v2.2.9: Block Fallback Configuration Standardization
 *
 * This migration standardizes the fallback configuration in blocks collection by:
 * 1. Converting string max_attempts values to integers for consistency
 * 2. Deactivating fallback configurations that have empty message arrays
 *
 * The changes ensure that:
 * - All max_attempts values are stored as integers
 * - Blocks with empty fallback messages are properly deactivated
 * - No blocks have inconsistent fallback configurations
 */
const standardizeBlockFallbackConfigurations = async ({
  logger,
}: MigrationServices) => {
  const BlockModel = mongoose.model<Block>(Block.name, blockSchema);

  try {
    // Step 1: Convert string max_attempts to integers
    const fallbackMaxAttemptsUpdateResult = await BlockModel.updateMany(
      {
        options: { $type: 'object' },
        'options.fallback': { $type: 'object' },
        'options.fallback.max_attempts': { $exists: true, $type: 'string' },
      },
      [
        {
          $set: {
            'options.fallback.max_attempts': {
              $toInt: '$options.fallback.max_attempts',
            },
          },
        },
      ],
    );

    if (fallbackMaxAttemptsUpdateResult) {
      logger.log(
        `[Migration v2.2.9] Converted max_attempts to integer in ${fallbackMaxAttemptsUpdateResult.modifiedCount} blocks.`,
      );
    }

    // Step 2: Deactivate fallback configurations with empty messages
    const fallbackActivationUpdateResult = await BlockModel.updateMany(
      {
        options: { $type: 'object' },
        'options.fallback': { $type: 'object' },
        $or: [{ 'options.fallback.message': { $size: 0 } }],
      },
      [
        {
          $set: {
            'options.fallback.max_attempts': 0,
            'options.fallback.active': false,
          },
        },
      ],
    );

    if (fallbackActivationUpdateResult) {
      logger.log(
        `[Migration v2.2.9] Deactivated fallback and set max_attempts=0 in ${fallbackActivationUpdateResult.modifiedCount} blocks with empty fallback messages.`,
      );
    }

    // Step 3: Validate the updates to ensure no inconsistencies remain
    const validationResult: Block[] = await BlockModel.find({
      $or: [
        {
          'options.fallback.max_attempts': { $type: 'string' },
        },
        {
          $or: [
            { 'options.fallback.message': { $size: 0 } },
            { 'options.fallback.message': { $elemMatch: { $eq: '' } } },
          ],
          'options.fallback.active': { $eq: true },
        },
      ],
    });

    if (validationResult.length > 0) {
      throw new Error(
        `[Migration v2.2.9] Validation failed: Found ${validationResult.length} blocks with inconsistent fallback configurations:`,
      );
    }

    logger.log(
      '[Migration v2.2.9] Successfully completed block fallback configuration standardization.',
    );
  } catch (error) {
    logger.error(
      `[Migration v2.2.9] Error during block fallback standardization: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw error;
  }
};

module.exports = {
  async up(services: MigrationServices) {
    try {
      await standardizeBlockFallbackConfigurations(services);
      return true;
    } catch (error) {
      if (services.logger) {
        services.logger.error(
          `[Migration v2.2.9] Error during block fallback standardization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
      return false;
    }
  },
  async down(services: MigrationServices) {
    if (services.logger) {
      services.logger.log(
        '[Migration v2.2.9] No rollback logic implemented as this is a data correction migration.',
      );
    }
    return false;
  },
};
