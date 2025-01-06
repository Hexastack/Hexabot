/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { existsSync } from 'fs';
import { join, resolve } from 'path';

import mongoose from 'mongoose';

import attachmentSchema, {
  Attachment,
} from '@/attachment/schemas/attachment.schema';
import subscriberSchema, { Subscriber } from '@/chat/schemas/subscriber.schema';
import { config } from '@/config';
import userSchema, { User } from '@/user/schemas/user.schema';
import { moveFile, moveFiles } from '@/utils/helpers/fs';

import { MigrationServices } from '../types';

const populateSubscriberAvatar = async ({ logger }: MigrationServices) => {
  const AttachmentModel = mongoose.model<Attachment>(
    Attachment.name,
    attachmentSchema,
  );
  const SubscriberModel = mongoose.model<Subscriber>(
    Subscriber.name,
    subscriberSchema,
  );

  const cursor = SubscriberModel.find().cursor();

  for await (const subscriber of cursor) {
    const foreignId = subscriber.foreign_id;
    if (!foreignId) {
      logger.debug(`No foreign id found for subscriber ${subscriber._id}`);
      continue;
    }

    const attachment = await AttachmentModel.findOne({
      name: RegExp(`^${foreignId}.jpe?g$`),
    });

    if (attachment) {
      await SubscriberModel.updateOne(
        { _id: subscriber._id },
        { $set: { avatar: attachment._id } },
      );
      logger.log(
        `Avatar attachment successfully updated for subscriber ${subscriber._id}`,
      );
    } else {
      logger.debug(
        `No avatar attachment found for subscriber ${subscriber._id}`,
      );
    }
  }
};

const unpopulateSubscriberAvatar = async ({ logger }: MigrationServices) => {
  const SubscriberModel = mongoose.model<Subscriber>(
    Subscriber.name,
    subscriberSchema,
  );

  // Rollback logic: unset the "avatar" field in all subscriber documents
  const cursor = SubscriberModel.find({ avatar: { $exists: true } }).cursor();

  for await (const subscriber of cursor) {
    await SubscriberModel.updateOne(
      { _id: subscriber._id },
      { $set: { avatar: null } },
    );
    logger.log(
      `Avatar attachment successfully updated for subscriber ${subscriber._id}`,
    );
  }
};

const updateOldAvatarsPath = async ({ logger }: MigrationServices) => {
  // Make sure the old folder is moved
  const oldPath = join(process.cwd(), process.env.AVATAR_DIR || '/avatars');
  if (existsSync(oldPath)) {
    logger.verbose(
      `Moving subscriber avatar files from ${oldPath} to ${config.parameters.avatarDir} ...`,
    );
    await moveFiles(oldPath, config.parameters.avatarDir);
    logger.log('Avatars folder successfully moved to its new location ...');
  } else {
    logger.log(`No old avatars folder found: ${oldPath}`);
  }

  // Move users avatars to the "uploads/avatars" folder
  const AttachmentModel = mongoose.model<Attachment>(
    Attachment.name,
    attachmentSchema,
  );
  const UserModel = mongoose.model<User>(User.name, userSchema);

  const cursor = UserModel.find().cursor();

  for await (const user of cursor) {
    try {
      if (user.avatar) {
        const avatar = await AttachmentModel.findOne({ _id: user.avatar });
        if (avatar) {
          const src = resolve(
            join(config.parameters.uploadDir, avatar.location),
          );
          const dst = resolve(
            join(config.parameters.avatarDir, avatar.location),
          );
          logger.verbose(`Moving user avatar file from ${src} to ${dst} ...`);
          await moveFile(src, dst);
        }
      }
    } catch (err) {
      logger.error(err);
      logger.error('Unable to move user avatar to the new folder');
    }
  }
};

const restoreOldAvatarsPath = async ({ logger }: MigrationServices) => {
  // Move users avatars to the "/app/avatars" folder
  const AttachmentModel = mongoose.model<Attachment>(
    Attachment.name,
    attachmentSchema,
  );
  const UserModel = mongoose.model<User>(User.name, userSchema);

  const cursor = UserModel.find().cursor();

  for await (const user of cursor) {
    try {
      if (user.avatar) {
        const avatar = await AttachmentModel.findOne({ _id: user.avatar });
        if (avatar) {
          const src = resolve(
            join(config.parameters.avatarDir, avatar.location),
          );
          const dst = resolve(
            join(config.parameters.uploadDir, avatar.location),
          );
          logger.verbose(`Moving user avatar file from ${src} to ${dst} ...`);
          await moveFile(src, dst);
        }
      }
    } catch (err) {
      logger.error(err);
      logger.error('Unable to move user avatar to the new folder');
    }
  }

  //
  const oldPath = join(process.cwd(), process.env.AVATAR_DIR || '/avatars');
  if (existsSync(config.parameters.avatarDir)) {
    await moveFiles(config.parameters.avatarDir, oldPath);
    logger.log('Avatars folder successfully moved to the old location ...');
  } else {
    logger.log('No avatars folder found ...');
  }
};

module.exports = {
  async up(services: MigrationServices) {
    await populateSubscriberAvatar(services);
    await updateOldAvatarsPath(services);
    return true;
  },
  async down(services: MigrationServices) {
    await unpopulateSubscriberAvatar(services);
    await restoreOldAvatarsPath(services);
    return true;
  },
};
