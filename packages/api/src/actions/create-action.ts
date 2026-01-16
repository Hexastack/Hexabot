/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs, Settings } from '@hexabot-ai/agentic';
import { Injectable, Type } from '@nestjs/common';

import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { ActionService } from './actions.service';
import { BaseAction } from './base-action';
import { ActionMetadataWithColor } from './types';

type CreateActionParams<
  I,
  O,
  C extends WorkflowRuntimeContext = WorkflowRuntimeContext,
  S extends Settings = Settings,
> = ActionMetadataWithColor<I, O, S> & {
  /**
   * Optional path to the action folder. If omitted, it is resolved automatically
   * from the caller's file location.
   */
  path?: string;
  execute: (args: ActionExecutionArgs<I, C, S>) => Promise<O> | O;
};

export function createAction<
  I,
  O,
  C extends WorkflowRuntimeContext = WorkflowRuntimeContext,
  S extends Settings = Settings,
>(params: CreateActionParams<I, O, C, S>): Type<BaseAction<I, O, C, S>> {
  @Injectable()
  class FnAction extends BaseAction<I, O, C, S> {
    constructor(actionService: ActionService) {
      super(
        {
          name: params.name,
          description: params.description,
          color: params.color,
          inputSchema: params.inputSchema,
          outputSchema: params.outputSchema,
          settingsSchema: params.settingsSchema,
        },
        actionService,
      );
    }

    async execute(args: ActionExecutionArgs<I, C, S>) {
      return params.execute(args);
    }
  }

  return FnAction;
}
