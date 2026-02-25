/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { ActionExecutionArgs } from '@hexabot-ai/agentic';

import type { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { ActionService } from './actions.service';
import { BaseAction } from './base-action';
import { createAction } from './create-action';

type EmptyPayload = Record<string, never>;

class NoSchemaClassAction extends BaseAction<
  EmptyPayload,
  EmptyPayload,
  WorkflowRuntimeContext,
  EmptyPayload
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'no_schema_class_action',
        description: 'Action declared without explicit schemas.',
      },
      actionService,
    );
  }

  async execute(
    _args: ActionExecutionArgs<
      EmptyPayload,
      WorkflowRuntimeContext,
      EmptyPayload
    >,
  ): Promise<EmptyPayload> {
    return {};
  }
}

describe('createAction schema defaults', () => {
  const actionService = {
    register: jest.fn(),
  } as unknown as ActionService;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('applies strict empty object schemas for class-based actions when omitted', () => {
    const action = new NoSchemaClassAction(actionService);

    expect(action.parseInput({})).toEqual({});
    expect(() => action.parseInput({ extra: true })).toThrow();
    expect(action.parseOutput({})).toEqual({});
    expect(() => action.parseOutput({ extra: true })).toThrow();
    expect(action.parseSettings({})).toEqual({});
    expect(action.parseSettings({ timeout_ms: 25 })).toEqual({
      timeout_ms: 25,
    });
    expect(() => action.parseSettings({ custom_flag: true })).toThrow();
  });

  it('applies strict empty object schemas for createAction when omitted', () => {
    const FnAction = createAction<
      EmptyPayload,
      EmptyPayload,
      WorkflowRuntimeContext,
      EmptyPayload
    >({
      name: 'no_schema_factory_action',
      description: 'Factory action declared without explicit schemas.',
      execute: () => ({}),
    });
    const action = new FnAction(actionService);

    expect(action.parseInput({})).toEqual({});
    expect(() => action.parseInput({ extra: true })).toThrow();
    expect(action.parseOutput({})).toEqual({});
    expect(() => action.parseOutput({ extra: true })).toThrow();
    expect(action.parseSettings({})).toEqual({});
    expect(action.parseSettings({ timeout_ms: 25 })).toEqual({
      timeout_ms: 25,
    });
    expect(() => action.parseSettings({ custom_flag: true })).toThrow();
  });
});
