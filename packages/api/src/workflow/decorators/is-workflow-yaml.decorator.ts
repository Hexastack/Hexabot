/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

import { parseWorkflowDefinition } from '../lib/workflow-definition';

/**
 * Validate that a string contains a parsable workflow YAML definition.
 */
export const IsWorkflowYaml =
  (options?: ValidationOptions) => (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isWorkflowYaml',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || value.trim() === '') {
            return false;
          }

          try {
            parseWorkflowDefinition(value);

            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args?: ValidationArguments) {
          try {
            parseWorkflowDefinition(args?.value as string);
          } catch (error) {
            return error instanceof Error
              ? error.message
              : 'Invalid workflow YAML';
          }

          return 'Invalid workflow YAML';
        },
      },
    });
  };
