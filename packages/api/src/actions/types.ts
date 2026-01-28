/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Action,
  ActionMetadata as BaseActionMetadata,
  BaseWorkflowContext,
  Settings,
} from '@hexabot-ai/agentic';

import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';
import { WorkflowType } from '@/workflow/types';

export type ActionName = `${string}_${string}`;

export const DEFAULT_ACTION_COLOR = '#98a7ba';

export const DEFAULT_ACTION_ICON = 'Zap';

export const DEFAULT_ACTION_GROUP = 'custom';

export const ALL_WORKFLOW_TYPES = Object.values(WorkflowType);

export type ActionWorkflowTypes = WorkflowType[];

export type ActionMetadata<
  I,
  O,
  S extends Settings = Settings,
> = BaseActionMetadata<I, O, S> & {
  icon?: string;
  color?: string;
  group?: string;
  workflowTypes?: ActionWorkflowTypes;
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
