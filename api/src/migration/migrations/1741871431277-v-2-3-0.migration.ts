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
  const LOG_MESSAGES = {
    up: {
      success: 'Successfully updated blocks to use handleBars syntaxe.',
      noUpdates: 'No blocks were updated to use handleBars syntaxe.',
      exception: 'Unable to update blocks to use handleBars syntaxe.',
    },
    down: {
      success: 'Successfully rollbacked handleBars syntaxe.',
      noUpdates: 'No blocks were rollbacked to not use handleBars syntxae.',
      exception: 'Unable blocks to rollback handleBars syntaxe.',
    },
  };
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
        logger.log(LOG_MESSAGES[action].success);
        return true;
      }
    } else {
      logger.log(LOG_MESSAGES[action].noUpdates);
      return true;
    }
  } catch (err) {
    logger.error(LOG_MESSAGES[action].exception, err);
    throw new Error(LOG_MESSAGES[action].exception);
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
