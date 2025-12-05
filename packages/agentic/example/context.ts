import { BaseWorkflowContext, type WorkflowEventEmitterLike } from '../src';

export type ExampleContextState = {
  user_id: string;
  account_tier: string;
  locale: string;
  timezone: string;
  channel: string;
};

export class ExampleContext extends BaseWorkflowContext<ExampleContextState> {
  constructor(state: ExampleContextState, eventEmitter?: WorkflowEventEmitterLike) {
    super(state, eventEmitter);
  }

  log(message: string, payload?: unknown): void {
    const suffix = payload === undefined ? '' : ` ${JSON.stringify(payload)}`;
    console.log(`[workflow] ${message}${suffix}`);
  }
}
