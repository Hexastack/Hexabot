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

import { Pattern } from '../schemas/types/pattern';

export function isPatternList(patterns: Pattern[]) {
  return (
    Array.isArray(patterns) &&
    patterns.every((pattern) => {
      if (typeof pattern === 'string') {
        // Check if valid regex
        if (pattern.endsWith('/') && pattern.startsWith('/')) {
          try {
            new RegExp(pattern.slice(1, -1), 'gi');
          } catch (err) {
            return false;
          }
          return true;
        }
        // Check if valid string (Equals/Like)
        return pattern !== '';
      } else if (Array.isArray(pattern)) {
        // Check if valid NLP pattern
        const nlpSchema = Joi.array()
          .items(
            Joi.object().keys({
              entity: Joi.string().required(),
              match: Joi.string().valid('entity', 'value').required(),
              value: Joi.string().required(),
            }),
          )
          .min(1);
        const nlpCheck = nlpSchema.validate(pattern);
        if (nlpCheck.error) {
          // console.log('Message validation failed! ', nlpCheck);
        }
        return !nlpCheck.error;
      } else if (typeof pattern === 'object') {
        // Invalid structure?
        const payloadSchema = Joi.object().keys({
          label: Joi.string().required(),
          value: Joi.any().required(),
          type: Joi.string(),
        });
        const payloadCheck = payloadSchema.validate(pattern);
        if (payloadCheck.error) {
          // console.log(
          //   'Message validation failed! ',
          //   payloadCheck,
          // );
        }
        return !payloadCheck.error;
      } else {
        return false;
      }
    })
  );
}

@ValidatorConstraint({ async: false })
export class PatternListValidator implements ValidatorConstraintInterface {
  validate(patterns: Pattern[]) {
    return isPatternList(patterns);
  }
}

export function IsPatternList(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: PatternListValidator,
    });
  };
}
