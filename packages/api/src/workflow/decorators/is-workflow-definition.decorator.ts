/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { validateWorkflow } from '@hexabot-ai/agentic';
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

import { bindingKinds } from '@/actions/runtime-bindings';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Validate that an object matches the workflow definition schema.
 */
export const IsWorkflowDefinition =
  (options?: ValidationOptions) => (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isWorkflowDefinition',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (!isPlainObject(value)) {
            return false;
          }

          return validateWorkflow(value, {
            bindingKinds,
          }).success;
        },
        defaultMessage(args?: ValidationArguments) {
          if (!isPlainObject(args?.value)) {
            return 'Workflow definition must be an object';
          }

          const validation = validateWorkflow(args?.value, {
            bindingKinds,
          });

          if (!validation.success) {
            return `Invalid workflow definition: ${validation.errors.join('; ')}`;
          }

          return 'Invalid workflow definition';
        },
      },
    });
  };
