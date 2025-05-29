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

const migrateBlockOptionsContentLimit = async (services: MigrationServices) => {
  const BlockModel = mongoose.model<Block>(Block.name, blockSchema).collection;

  const adminUser = await getAdminUser();

  if (!adminUser) {
    services.logger.warn('Unable to process block, no admin user found');
    return;
  }

  try {
    await BlockModel.updateMany(
      { 'options.content.limit': { $exists: true } },
      [
        {
          $set: {
            'options.content.limit': { $toInt: '$options.content.limit' },
          },
        },
      ],
    );
  } catch (error) {
    services.logger.error(`Failed to update limit : ${error.message}`);

    throw error instanceof Error ? error : new Error(error);
  }
};

const migrateBlockOptionsContentButtonsUrl = async (
  services: MigrationServices,
) => {
  const BlockModel = mongoose.model<Block>(Block.name, blockSchema).collection;

  try {
    await BlockModel.updateMany(
      { 'options.content.buttons.url': false },
      {
        $set: {
          'options.content.buttons.$[].url': '',
        },
      },
    );
  } catch (error) {
    services.logger.error(`Failed to update button url : ${error.message}`);

    throw error instanceof Error ? error : new Error(error);
  }
};

const migrateBlockOptionsFallback = async (services: MigrationServices) => {
  const BlockModel = mongoose.model<Block>(Block.name, blockSchema).collection;

  try {
    await BlockModel.updateMany(
      { 'options.fallback.max_attempts': { $exists: true, $type: 'string' } },
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
  } catch (error) {
    services.logger.error(`Failed to update max_attempts : ${error.message}`);
    throw error instanceof Error ? error : new Error(error);
  }

  try {
    await BlockModel.updateMany({ 'options.fallback.message': { $size: 0 } }, [
      {
        $set: {
          'options.fallback.max_attempts': 0,
          'options.fallback.active': false,
        },
      },
    ]);
  } catch (error) {
    services.logger.error(
      `Failed to update max_attempts, active : ${error.message}`,
    );
    throw error instanceof Error ? error : new Error(error);
  }
};

module.exports = {
  async up(services: MigrationServices) {
    try {
      await migrateBlockOptionsContentLimit(services);
      await migrateBlockOptionsContentButtonsUrl(services);
      await migrateBlockOptionsFallback(services);

      return true;
    } catch (error) {
      services.logger.error(`Migration failed : ${error.message}`);
      throw error instanceof Error ? error : new Error(error);
    }
  },
  async down(_services: MigrationServices) {
    return true;
  },
};
