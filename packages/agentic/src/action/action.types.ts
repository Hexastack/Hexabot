/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ZodType, ZodTypeDef } from 'zod';

import { BaseWorkflowContext } from '../context';
import { Settings } from '../dsl.types';
import { WorkflowSuspendedError } from '../runtime-error';
import { Deferred } from '../utils/deferred';

export interface ActionMetadata<I, O, S extends Settings = Settings> {
  name: string;
  description: string;
  inputSchema: ZodType<I, ZodTypeDef, unknown>;
  outputSchema: ZodType<O, ZodTypeDef, unknown>;
  settingsSchema?: ZodType<S, ZodTypeDef, unknown>;
}

export interface ActionExecutionArgs<
  I,
  C extends BaseWorkflowContext = BaseWorkflowContext,
  S extends Settings = Settings,
> {
  input: I;
  context: C;
  settings: S;
}

export interface Action<
  I,
  O,
  C extends BaseWorkflowContext = BaseWorkflowContext,
  S extends Settings = Settings,
> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ZodType<I, ZodTypeDef, unknown>;
  readonly outputSchema: ZodType<O, ZodTypeDef, unknown>;
  readonly settingSchema?: ZodType<S, ZodTypeDef, unknown>;

  execute(args: ActionExecutionArgs<I, C, S>): Promise<O>;
  parseInput(payload: unknown): I;
  parseOutput(payload: unknown): O;
  parseSettings(payload: unknown): S;
  run(payload: unknown, context: C, settings?: Partial<S>): Promise<O>;
}

export type InferActionArgs<
  A extends Action<unknown, unknown, BaseWorkflowContext, Settings>,
> = Parameters<A['execute']>[0];

export type InferActionInput<
  A extends Action<unknown, unknown, BaseWorkflowContext, Settings>,
> = InferActionArgs<A>['input'];

export type InferActionContext<
  A extends Action<unknown, unknown, BaseWorkflowContext, Settings>,
> = InferActionArgs<A>['context'];

export type InferActionOutput<
  A extends Action<unknown, unknown, BaseWorkflowContext, Settings>,
> = Awaited<ReturnType<A['execute']>>;

export type InferActionSettings<
  S extends Action<unknown, unknown, BaseWorkflowContext, Settings>,
> = InferActionArgs<S>['settings'];

export interface SuspensionNotice {
  error: WorkflowSuspendedError;
  resume: Deferred<unknown>;
}

export type ActionExecutionOutcome<T> =
  | { type: 'completed'; value: T }
  | { type: 'suspended'; error: WorkflowSuspendedError };
