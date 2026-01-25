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

import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

export type ActionName = `${string}_${string}`;

export const DEFAULT_ACTION_COLOR = '#98a7ba';

export const DEFAULT_ACTION_ICON = 'Zap';

export const DEFAULT_ACTION_GROUP = 'custom';

export type ActionMetadataWithColor<
  I,
  O,
  S extends Settings = Settings,
> = ActionMetadata<I, O, S> & {
  icon?: string;
  color?: string;
  group?: string;
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
