/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z, ZodType } from 'zod';

import { BaseWorkflowContext } from '../context';

import { AbstractAction } from './abstract-action';
import type {
  ActionExecutionArgs,
  ActionMetadata,
  AnyRuntimeBindings,
} from './action.types';

export type DefineActionParams<
  I,
  O,
  Ctx extends BaseWorkflowContext,
  S,
  B extends AnyRuntimeBindings = AnyRuntimeBindings,
> = {
  name: string;
  description?: string;
  inputSchema?: ZodType<I>;
  outputSchema?: ZodType<O>;
  settingSchema?: ZodType<S>;
  execute: (args: ActionExecutionArgs<I, Ctx, S, B>) => Promise<O> | O;
};

/**
 * Builds an {@link AbstractAction} subclass from simple configuration.
 *
 * @param params - Action definition containing metadata and runtime logic.
 * @returns Instantiated action ready to be used by a workflow.
 * @typeParam I - Action input type.
 * @typeParam O - Action output type.
 * @typeParam Ctx - Workflow context type.
 */
export function defineAction<
  I,
  O,
  Ctx extends BaseWorkflowContext,
  S,
  B extends AnyRuntimeBindings = AnyRuntimeBindings,
>(params: DefineActionParams<I, O, Ctx, S, B>) {
  type ActionArgs = ActionExecutionArgs<I, Ctx, S, B>;

  const defaultSettingsSchema = z.any() as ZodType<S>;
  const defaultInputSchema = z.any() as ZodType<I>;
  const defaultOutputSchema = z.any() as ZodType<O>;

  class FnAction extends AbstractAction<I, O, Ctx, S, B> {
    constructor() {
      const metadata: ActionMetadata<I, O, S> = {
        name: params.name,
        description: params.description ?? '',
        inputSchema: params.inputSchema ?? defaultInputSchema,
        outputSchema: params.outputSchema ?? defaultOutputSchema,
        settingsSchema: params.settingSchema ?? defaultSettingsSchema,
      };

      super(metadata);
    }

    /**
     * Delegates to the user supplied execute callback.
     *
     * @param args - Action execution arguments supplied by the runner.
     * @returns Result of the user callback as a promise.
     */
    async execute(args: ActionArgs): Promise<O> {
      return await Promise.resolve(params.execute(args));
    }
  }

  return new FnAction();
}
