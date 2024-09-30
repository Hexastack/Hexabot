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
import Joi from 'joi';

import { BlockMessage } from '../schemas/types/message';

export function isValidMessage(msg: any) {
  if (typeof msg === 'string' && msg !== '') {
    // Custom code
    const MESSAGE_REGEX = /^function \(context\) \{[^]+\}/;
    if (!MESSAGE_REGEX.test(msg)) {
      // eslint-disable-next-line
      console.error('Block Model : Invalid custom code.', msg);
      return false;
    } else {
      return true;
    }
  } else if (Array.isArray(msg)) {
    // Simple text message
    const textSchema = Joi.array().items(Joi.string().max(1000).required());
    const textCheck = textSchema.validate(msg);
    return !textCheck.error;
  } else if (typeof msg === 'object') {
    if ('plugin' in msg) {
      return true;
    } else {
      const buttonsSchema = Joi.array().items(
        Joi.object().keys({
          type: Joi.string().valid('postback', 'web_url').required(),
          title: Joi.string().max(20),
          payload: Joi.alternatives().conditional('type', {
            is: 'postback',
            then: Joi.string().max(1000).required(),
            otherwise: Joi.forbidden(),
          }),
          url: Joi.alternatives().conditional('type', {
            is: 'web_url',
            then: Joi.string().uri(),
            otherwise: Joi.forbidden(),
          }),
          messenger_extensions: Joi.alternatives().conditional('type', {
            is: 'web_url',
            then: Joi.boolean(),
            otherwise: Joi.forbidden(),
          }),
          webview_height_ratio: Joi.alternatives().conditional('type', {
            is: 'web_url',
            then: Joi.string().valid('compact', 'tall', 'full'),
            otherwise: Joi.forbidden(),
          }),
        }),
      );
      // Attachment message
      const objectSchema = Joi.object().keys({
        text: Joi.string().max(1000),
        attachment: Joi.object().keys({
          type: Joi.string()
            .valid('image', 'audio', 'video', 'file', 'unknown')
            .required(),
          payload: Joi.object().keys({
            url: Joi.string().uri(),
            attachment_id: Joi.string(),
          }),
        }),
        elements: Joi.boolean(),
        cards: Joi.object().keys({
          default_action: buttonsSchema.max(1),
          buttons: buttonsSchema.max(3),
        }),
        buttons: buttonsSchema.max(3),
        quickReplies: Joi.array()
          .items(
            Joi.object().keys({
              content_type: Joi.string()
                .valid('text', 'location', 'user_phone_number', 'user_email')
                .required(),
              title: Joi.alternatives().conditional('content_type', {
                is: 'text',
                then: Joi.string().max(20).required(),
              }),
              payload: Joi.alternatives().conditional('content_type', {
                is: 'text',
                then: Joi.string().max(1000).required(),
              }),
            }),
          )
          .max(11),
      });
      const objectCheck = objectSchema.validate(msg);
      if (objectCheck.error) {
        // eslint-disable-next-line
        console.log('Message validation failed! ', objectCheck);
      }
      return !objectCheck.error;
    }
  } else {
    return false;
  }
}

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
