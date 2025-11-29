import z, { ZodType, ZodTypeDef } from "zod";
import { WorkflowContext } from "../context";
import { Settings } from "../dsl.types";
import { AbstractAction } from "./abstract-action";

export interface ActionMetadata<I, O, S = undefined> {
  name: string;
  description: string;
  inputSchema: ZodType<I, ZodTypeDef, unknown>;
  outputSchema: ZodType<O, ZodTypeDef, unknown>;
  settingsSchema?: ZodType<S, ZodTypeDef, unknown>;
}

export interface ActionExecutionArgs<I, C extends WorkflowContext, S = undefined> {
  input: I;
  context: C;
  settings: S;
}

export type DefineActionParams<I, O, Ctx extends WorkflowContext, S = undefined> = {
  name: string;
  description?: string;
  inputSchema?: ZodType<I, ZodTypeDef, unknown>;
  outputSchema?: ZodType<O, ZodTypeDef, unknown>;
  settingSchema?: ZodType<S, ZodTypeDef, unknown>;
  execute: (args: ActionExecutionArgs<I, Ctx, S>) => Promise<O> | O;
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
export function defineAction<I, O, Ctx extends WorkflowContext, S extends Settings>(
  params: DefineActionParams<I, O, Ctx, S>
) {
  /**
   * Concrete action generated for the supplied configuration options.
   */
  class FnAction extends AbstractAction<I, O, Ctx, S> {
    constructor() {
      const metadata: ActionMetadata<I, O, S> = {
        name: params.name,
        description: params.description ?? '',
        inputSchema: (params.inputSchema ?? (z.any() as ZodType<I, ZodTypeDef, unknown>)) as ZodType<
          I,
          ZodTypeDef,
          unknown
        >,
        outputSchema: (params.outputSchema ?? (z.any() as ZodType<O, ZodTypeDef, unknown>)) as ZodType<
          O,
          ZodTypeDef,
          unknown
        >,
        settingsSchema: params.settingSchema as ZodType<S, ZodTypeDef, unknown> | undefined
      };

      super(metadata);
    }

    /**
     * Delegates to the user supplied execute callback.
     *
     * @param args - Action execution arguments supplied by the runner.
     * @returns Result of the user callback as a promise.
     */
    async execute(args: ActionExecutionArgs<I, Ctx, S>): Promise<O> {
      return await Promise.resolve(params.execute(args));
    }
  }

  return new FnAction();
}
