/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Action,
  ActionExecutionArgs,
  ActionMetadata as BaseActionMetadata,
  BaseWorkflowContext,
} from '@hexabot-ai/agentic';
import type { ZodType } from 'zod';

import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';
import { WorkflowType } from '@/workflow/types';

import { RuntimeBindings } from './runtime-bindings';

export type ActionName = `${string}_${string}`;

export const DEFAULT_ACTION_COLOR = '#98a7ba';

export const DEFAULT_ACTION_ICON = 'Zap';

export const DEFAULT_ACTION_GROUP = 'custom';

export const ALL_WORKFLOW_TYPES = Object.values(WorkflowType);

export type ActionWorkflowTypes = WorkflowType[];

export type ActionMetadata<I, O, S = unknown> = Omit<
  BaseActionMetadata<I, O, S>,
  'inputSchema' | 'outputSchema' | 'settingsSchema'
> & {
  inputSchema?: ZodType<I>;
  outputSchema?: ZodType<O>;
  settingsSchema?: ZodType<S>;
  icon?: string;
  color?: string;
  group?: string;
  workflowTypes?: ActionWorkflowTypes;
};

export type AnyAction = Action<
  unknown,
  unknown,
  ConversationalWorkflowContext,
  unknown
>;

export type ActionRegistry<
  A extends Action<unknown, unknown, BaseWorkflowContext, unknown> = AnyAction,
> = Map<ActionName, A>;

export type ExecArgs<
  I,
  C extends BaseWorkflowContext,
  S = unknown,
> = ActionExecutionArgs<I, C, S, RuntimeBindings>;
