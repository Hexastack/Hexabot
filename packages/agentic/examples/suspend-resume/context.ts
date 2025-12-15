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

export type SuspendResumeContextState = {
  channel: string;
};

export class SuspendResumeContext extends BaseWorkflowContext<SuspendResumeContextState> {
  public eventEmitter: WorkflowEventEmitterLike<WorkflowEventEmitter>;

  constructor(
    state: SuspendResumeContextState,
    eventEmitter: WorkflowEventEmitterLike<WorkflowEventEmitter> = new WorkflowEventEmitter(),
  ) {
    super(state);
    this.eventEmitter = eventEmitter;
  }

  log(message: string, payload?: unknown): void {
    const suffix = payload === undefined ? '' : ` ${JSON.stringify(payload)}`;
    console.log(`[suspend/resume] ${message}${suffix}`);
  }
}
