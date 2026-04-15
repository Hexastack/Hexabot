/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseWorkflowContext,
  WorkflowEventEmitter,
  type WorkflowEventEmitterLike,
} from '../../src';

export type LoopExampleContextState = {
  channel: string;
};

export class LoopExampleContext extends BaseWorkflowContext<LoopExampleContextState> {
  public eventEmitter: WorkflowEventEmitterLike<WorkflowEventEmitter>;

  constructor(
    state: LoopExampleContextState,
    eventEmitter: WorkflowEventEmitterLike<WorkflowEventEmitter> = new WorkflowEventEmitter(),
  ) {
    super(state);
    this.eventEmitter = eventEmitter;
  }

  log(message: string, payload?: unknown): void {
    const suffix = payload === undefined ? '' : ` ${JSON.stringify(payload)}`;
    console.log(`[loop] ${message}${suffix}`);
  }
}
