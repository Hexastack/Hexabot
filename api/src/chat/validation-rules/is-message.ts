/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { z } from 'zod';

import attachmentSchema from '@/attachment/schemas/attachment.schema';

import { buttonsSchema } from '../schemas/types/button';
import { BlockMessage } from '../schemas/types/message';
import { quickRepliesArraySchema } from '../schemas/types/quick-reply';

// Schemas for different components
const textSchema = z.array(z.string().max(1000));

const pluginSchema = z.object({
  plugin: z.string(),
  args: z.record(z.any()), // Plugin-specific settings
});

// Message schema variations
const baseTextMessageSchema = z.object({
  text: z.string().max(1000).optional(),
});

const messageWithButtonsSchema = baseTextMessageSchema.extend({
  buttons: buttonsSchema,
});

const messageWithQuickRepliesSchema = baseTextMessageSchema.extend({
  quickReplies: quickRepliesArraySchema,
});

const messageWithAttachmentSchema = z.object({
  attachment: attachmentSchema,
  quickReplies: quickRepliesArraySchema.optional(),
});

const messageWithElementsSchema = z.object({
  elements: z.array(z.record(z.any())), // Array of generic elements
});

const messageWithPluginSchema = z.object({
  plugin: pluginSchema,
});

// Union of all possible message types
const messageSchema = z.union([
  textSchema,
  messageWithButtonsSchema,
  messageWithQuickRepliesSchema,
  messageWithAttachmentSchema,
  messageWithElementsSchema,
  messageWithPluginSchema,
]);

export const isValidMessage = (msg: unknown): boolean => {
  return messageSchema.safeParse(msg).success;
};

@ValidatorConstraint({ async: false })
export class MessageValidator implements ValidatorConstraintInterface {
  validate(msg: BlockMessage) {
    return isValidMessage(msg);
  }
}

export function IsMessage(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: MessageValidator,
    });
  };
}
