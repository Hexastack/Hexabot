/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseWorkflowContext } from '@hexabot-ai/agentic';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { LoggerService } from '@/logger/logger.service';

import { BaseAction } from './base-action';
import {
  ActionName,
  ActionRegistry,
  ActionSchemaDefinition,
  JsonSchema,
} from './types';

@Injectable()
export class ActionService {
  private readonly registry: ActionRegistry<
    BaseAction<any, any, BaseWorkflowContext, any>
  > = new Map();

  constructor(private readonly logger: LoggerService) {}

  register<C extends BaseWorkflowContext>(
    action: BaseAction<any, any, C, any>,
  ) {
    const name = action.getName();
    if (this.registry.has(name)) {
      throw new InternalServerErrorException(
        `Action with name ${name} already exist`,
      );
    }

    this.registry.set(name, action);
    this.logger.log(`Action "${name}" has been registered!`);
  }

  get(name: ActionName) {
    const action = this.registry.get(name);
    if (!action) {
      throw new Error(`Unable to find action "${name}"`);
    }

    return action;
  }

  getAll() {
    return Array.from(this.registry.values());
  }

  private buildJsonSchema(schema: ZodTypeAny, name: string): JsonSchema {
    // Avoid TS2589 by narrowing zod-to-json-schema's generic signature.
    const converter = zodToJsonSchema as unknown as (
      schema: ZodTypeAny,
      options: { name: string; target: 'jsonSchema7' },
    ) => JsonSchema;

    return converter(schema, {
      name,
      target: 'jsonSchema7',
    });
  }

  getAllSchemaDefinitions(): ActionSchemaDefinition[] {
    return this.getAll().map((action) => {
      const name = action.getName();

      return {
        name,
        description: action.description,
        icon: action.icon,
        color: action.color,
        inputSchema: this.buildJsonSchema(action.inputSchema, `${name}_input`),
        outputSchema: this.buildJsonSchema(
          action.outputSchema,
          `${name}_output`,
        ),
        settingsSchema: this.buildJsonSchema(
          action.settingSchema,
          `${name}_settings`,
        ),
      };
    });
  }

  getRegistry(): Record<
    ActionName,
    BaseAction<any, any, BaseWorkflowContext, any>
  > {
    return Object.fromEntries(
      this.getAll().map((action) => [action.getName(), action]),
    );
  }
}
