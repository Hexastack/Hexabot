/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose, { AnyBulkWriteOperation } from 'mongoose';

import blockSchema, { Block } from '@/chat/schemas/block.schema';
import translationSchema, {
  Translation,
} from '@/i18n/schemas/translation.schema';

import { MigrationAction, MigrationServices } from '../types';

const updateContextVarsHandleBarsSyntaxe = async (
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

  // Try to replace braces for all attributes of type string or string[]
  function updateStringsInObject(obj: any): any {
    if (typeof obj === 'string') {
      return updateBraces(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) =>
        typeof item === 'string' ? updateBraces(item) : item,
      );
    }

    if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        obj[key] = updateStringsInObject(obj[key]);
      }
    }

    return obj;
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
      if (doc.message && typeof doc.message === 'object') {
        const updatedMessage = updateStringsInObject(doc.message);
        doc.message = updatedMessage;
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

const updateContextVarsHandleBarsSyntaxInTranslation = async (
  action: MigrationAction,
  { logger }: MigrationServices,
) => {
  const LOG_MESSAGES = {
    up: {
      success: 'Successfully updated translations to use handleBars syntax.',
      noUpdates: 'No translations were updated to use handleBars syntax.',
      exception: 'Unable to update translations to use handleBars syntax.',
    },
    down: {
      success: 'Successfully rollbacked handleBars syntax in translations.',
      noUpdates:
        'No translations were rollbacked to not use handleBars syntax.',
      exception: 'Unable to rollback handleBars syntax in translations.',
    },
  };

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
    const TranslationModel = mongoose.model(
      Translation.name,
      translationSchema,
    ); // Use the correct model for translations
    const translations = await TranslationModel.find({}, {}, { lean: true });

    const bulkOps: AnyBulkWriteOperation<any>[] = [];

    translations.forEach((doc) => {
      let updated = false;

      // Update the "str" field if it exists
      if (doc.str) {
        const updatedStr = updateBraces(doc.str);
        doc.str = updatedStr;
        updated = true;
      }

      // Update translations if they exist
      if (doc.translations && typeof doc.translations === 'object') {
        for (const lang in doc.translations) {
          if (doc.translations[lang]) {
            const updatedTranslation = updateBraces(doc.translations[lang]);
            doc.translations[lang] = updatedTranslation;
            updated = true;
          }
        }
      }

      // If any field was updated, prepare the bulk operation
      if (updated) {
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { str: doc.str, translations: doc.translations } },
          },
        });
      }
    });

    // Perform the bulk update if there are operations
    if (bulkOps.length > 0) {
      const result = await TranslationModel.bulkWrite(bulkOps);
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
    await updateContextVarsHandleBarsSyntaxe(MigrationAction.UP, services);
    await updateContextVarsHandleBarsSyntaxInTranslation(
      MigrationAction.UP,
      services,
    );
    return true;
  },
  async down(services: MigrationServices) {
    await updateContextVarsHandleBarsSyntaxe(MigrationAction.DOWN, services);
    await updateContextVarsHandleBarsSyntaxInTranslation(
      MigrationAction.DOWN,
      services,
    );
    return true;
  },
};
