/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, Type } from '@nestjs/common';

import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { ActionService } from './actions.service';
import { BaseAction } from './base-action';
import { ActionMetadata, ExecArgs } from './types';

type CreateActionParams<
  I,
  O,
  C extends WorkflowRuntimeContext = WorkflowRuntimeContext,
  S = unknown,
> = ActionMetadata<I, O, S> & {
  /**
   * Optional path to the action folder. If omitted, it is resolved automatically
   * from the caller's file location.
   */
  path?: string;
  execute: (args: ExecArgs<I, C, S>) => Promise<O> | O;
};

export function createAction<
  I,
  O,
  C extends WorkflowRuntimeContext = WorkflowRuntimeContext,
  S = unknown,
>(params: CreateActionParams<I, O, C, S>): Type<BaseAction<I, O, C, S>> {
  @Injectable()
  class FnAction extends BaseAction<I, O, C, S> {
    constructor(actionService: ActionService) {
      super(
        {
          name: params.name,
          description: params.description,
          color: params.color,
          group: params.group,
          icon: params.icon,
          workflowTypes: params.workflowTypes,
          supportedBindings: params.supportedBindings,
          inputSchema: params.inputSchema,
          outputSchema: params.outputSchema,
          settingsSchema: params.settingsSchema,
        },
        actionService,
      );
    }

    async execute(args: ExecArgs<I, C, S>) {
      return params.execute(args);
    }
  }

  return FnAction;
}
