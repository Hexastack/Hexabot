/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action, BaseWorkflowContext, Settings } from '@hexabot-ai/agentic';

import { WorkflowContext } from './workflow-context';

export type ActionName = `${string}_${string}`;

export type AnyAction = Action<unknown, unknown, WorkflowContext, Settings>;

export type ActionRegistry<
  A extends Action<unknown, unknown, BaseWorkflowContext, Settings> = AnyAction,
> = Map<ActionName, A>;
