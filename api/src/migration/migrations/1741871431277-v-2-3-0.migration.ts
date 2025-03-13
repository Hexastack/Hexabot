/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose, { AnyBulkWriteOperation } from 'mongoose';

import blockSchema, { Block } from '@/chat/schemas/block.schema';

import { MigrationAction, MigrationServices } from '../types';

const updateContextVarsHandleBarsSyntaxe2 = async (
  action: MigrationAction,
  { logger }: MigrationServices,
) => {
  const BlockModel = mongoose.model<Block>(Block.name, blockSchema);

  // Define the regex patterns based on UP or DOWN
  const bracesRegex =
    action === MigrationAction.UP
      ? /\{(context\.[^}]+)\}/g
      : /\{\{(context\.[^}]+)\}\}/g;

  const replacement = action === MigrationAction.UP ? '{{$1}}' : '{$1}';

  // Function to update braces based on the direction
  function updateBraces(text: string) {
    return text.replace(bracesRegex, replacement);
  }

  try {
    const blocks = await BlockModel.find({}, {}, { lean: true });
    const bulkOps: AnyBulkWriteOperation<Block>[] = [];

    blocks.forEach((doc) => {
      let updated = false;

      // Update options.fallback.message if it exists
      if (doc.options?.fallback?.message) {
        const updatedMessages = doc.options.fallback.message.map((msg) =>
          updateBraces(msg),
        );
        doc.options.fallback.message = updatedMessages;
        updated = true;
      }

      // Update message array if it exists
      if (doc.message && Array.isArray(doc.message)) {
        const updatedMessages = doc.message.map((msg) => updateBraces(msg));
        doc.message = updatedMessages;
        updated = true;
      }

      // quick replies & buttons case
      if (typeof doc.message == 'object' && 'text' in doc.message) {
        const updatedText = updateBraces(doc.message.text);
        doc.message.text = updatedText;
        updated = true;
      }

      if (updated) {
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: { options: doc.options, message: doc.message },
            },
          },
        });
      }
    });

    // Perform a bulk update
    if (bulkOps.length > 0) {
      const result = await BlockModel.bulkWrite(bulkOps);
      if (result.matchedCount > 0) {
        logger.log(
          action === MigrationAction.UP
            ? 'Successfully updated blocks to use handleBars syntax'
            : 'Successfully updated blocks to not use handleBars syntax',
        );
        return true;
      } else {
        logger.log(
          action === MigrationAction.UP
            ? 'No blocks were updated (up)'
            : 'No blocks were updated (down)',
        );
        return false;
      }
    } else {
      logger.log(
        action === MigrationAction.UP
          ? 'No updates needed (up)'
          : 'No updates needed (down)',
      );
      return false;
    }
  } catch (err) {
    logger.error(
      action === MigrationAction.UP
        ? 'Unable to update blocks to use handleBars syntax'
        : 'Unable to update blocks to not use handleBars syntax',
      err,
    );
    throw new Error(
      action === MigrationAction.UP
        ? 'Unable to update blocks to use handleBars syntax'
        : 'Unable to update blocks to not use handleBars syntax',
    );
  }
};

module.exports = {
  async up(services: MigrationServices) {
    await updateContextVarsHandleBarsSyntaxe2(MigrationAction.UP, services);
    return true;
  },
  async down(services: MigrationServices) {
    await updateContextVarsHandleBarsSyntaxe2(MigrationAction.DOWN, services);
    return true;
  },
};
