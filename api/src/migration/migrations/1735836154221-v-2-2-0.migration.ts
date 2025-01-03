/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import attachmentSchema, {
  Attachment,
} from '@/attachment/schemas/attachment.schema';
import subscriberSchema, { Subscriber } from '@/chat/schemas/subscriber.schema';

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

module.exports = {
  async up(services: MigrationServices) {
    await populateSubscriberAvatar(services);
    return true;
  },
  async down(services: MigrationServices) {
    await unpopulateSubscriberAvatar(services);
    return true;
  },
};
