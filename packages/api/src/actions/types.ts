/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Action,
  ActionMetadata,
  BaseWorkflowContext,
  Settings,
} from '@hexabot-ai/agentic';
import type { zodToJsonSchema } from 'zod-to-json-schema';

import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

export type ActionName = `${string}_${string}`;

export type JsonSchema = ReturnType<typeof zodToJsonSchema>;

export const DEFAULT_ACTION_COLOR = '#98a7ba';

export type ActionMetadataWithColor<
  I,
  O,
  S extends Settings = Settings,
> = ActionMetadata<I, O, S> & {
  color?: string;
};

export type ActionSchemaDefinition = {
  name: ActionName;
  description: string;
  color: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  settingsSchema: JsonSchema;
};

export type AnyAction = Action<
  unknown,
  unknown,
  ConversationalWorkflowContext,
  Settings
>;

export type ActionRegistry<
  A extends Action<unknown, unknown, BaseWorkflowContext, Settings> = AnyAction,
> = Map<ActionName, A>;
