/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import blockSchema, { Block } from '@/chat/schemas/block.schema';
import roleSchema, { Role } from '@/user/schemas/role.schema';
import userSchema, { User } from '@/user/schemas/user.schema';

import { MigrationServices } from '../types';

/**
 * @returns The admin user or null
 */
const getAdminUser = async () => {
  const RoleModel = mongoose.model<Role>(Role.name, roleSchema);
  const UserModel = mongoose.model<User>(User.name, userSchema);

  const adminRole = await RoleModel.findOne({ name: 'admin' });
  const user = await UserModel.findOne({ roles: [adminRole!._id] }).sort({
    createdAt: 'asc',
  });

  return user!;
};

const migrateBlockOptionsContentLimit = async ({
  logger,
}: MigrationServices) => {
  const BlockModel = mongoose.model<Block>(Block.name, blockSchema);

  // Find blocks where "options.content.limit" exists and has string type
  const cursor = BlockModel.find({
    'options.content.limit': { $exists: true, $type: 'string' },
  }).cursor();

  const updateBlockOptionsContentLimit = async (
    blockId: mongoose.Types.ObjectId,
    limit: string | number,
  ) => {
    await BlockModel.updateOne(
      { _id: blockId },
      { $set: { 'options.content.limit': limit } },
    );
  };

  const getBlockOptionsContentLimitDefaultValue = (block: Block): number => {
    return block.options.content?.display === 'list' ? 1 : 2;
  };

  const adminUser = await getAdminUser();

  if (!adminUser) {
    logger.warn('Unable to process block, no admin user found');
    return;
  }

  for await (const block of cursor) {
    try {
      if (block.options.content && 'limit' in block.options.content) {
        const limitDefaultValue =
          getBlockOptionsContentLimitDefaultValue(block);
        const newLimitValue =
          block.options.content.limit > 0
            ? parseInt(block.options.content.limit.toString())
            : limitDefaultValue;

        await updateBlockOptionsContentLimit(block._id, newLimitValue);
      } else {
        throw new Error('Unable to process the block update');
      }
    } catch (error) {
      logger.error(
        `Failed to update limit ${block._id}: ${error.message}, defaulting limit to 2`,
      );

      try {
        await updateBlockOptionsContentLimit(block._id, 2);
      } catch (err) {
        logger.error(
          `Failed to update limit ${block._id}: ${error.message}, unable to default to 2`,
        );
      }
    }
  }
};

const migrateBlockOptionsContentButtonsUrl = async ({
  logger,
}: MigrationServices) => {
  const BlockModel = mongoose.model<Block>(Block.name, blockSchema);

  const cursor = BlockModel.find({
    $or: [
      { 'options.content.buttons.url': { $exists: false } },
      { 'options.content.buttons.url': false },
    ],
  }).cursor();

  for await (const block of cursor) {
    try {
      await BlockModel.updateOne(
        { _id: block.id },
        {
          $set: {
            'options.content.buttons.$[].url': '',
          },
        },
      );
    } catch (error) {
      logger.error(
        `Failed to update button url ${block._id}: ${error.message}`,
      );
    }
  }
};

const migrateBlockOptionsFallback = async ({ logger }: MigrationServices) => {
  const BlockModel = mongoose.model<Block>(Block.name, blockSchema);

  const cursor = BlockModel.find({
    'options.fallback.max_attempts': { $exists: true },
  }).cursor();

  for await (const block of cursor) {
    try {
      if (block.options.fallback?.message.length === 0) {
        await BlockModel.updateOne(
          { _id: block.id },
          {
            $set: {
              'options.fallback.max_attempts': 0,
              'options.fallback.active': false,
            },
          },
        );
      } else {
        await BlockModel.updateOne(
          { _id: block.id },
          {
            $set: {
              'options.fallback.max_attempts': parseInt(
                (block.options.fallback?.max_attempts || 0).toString(),
              ),
            },
          },
        );
      }
    } catch (error) {
      logger.error(`Failed to update fallback ${error.message}`);
    }
  }
};

module.exports = {
  async up(services: MigrationServices) {
    await migrateBlockOptionsContentLimit(services);
    await migrateBlockOptionsContentButtonsUrl(services);
    await migrateBlockOptionsFallback(services);
    return true;
  },
  async down(_services: MigrationServices) {
    return true;
  },
};
