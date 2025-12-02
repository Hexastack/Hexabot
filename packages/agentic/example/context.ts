import { BaseWorkflowContext } from '../src';

export type ExampleContextState = {
  user_id: string;
  account_tier: string;
  locale: string;
  timezone: string;
  channel: string;
};

export class ExampleContext extends BaseWorkflowContext {
  user_id: string;
  account_tier: string;
  locale: string;
  timezone: string;
  channel: string;

  constructor(state: ExampleContextState) {
    super(state);
    this.user_id = state.user_id;
    this.account_tier = state.account_tier;
    this.locale = state.locale;
    this.timezone = state.timezone;
    this.channel = state.channel;
  }

  log(message: string, payload?: unknown): void {
    const suffix = payload === undefined ? '' : ` ${JSON.stringify(payload)}`;
    console.log(`[workflow] ${message}${suffix}`);
  }
}
