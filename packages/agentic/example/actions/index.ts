import type { Action } from '../../src';
import type { Settings } from '../../src';
import type { ExampleContext } from '../context';

import { awaitUserInput } from './await-user-input';
import { callLlm } from './call-llm';
import { createTicket } from './create-ticket';
import { decisionRouter } from './decision-router';
import { getCalendarEvents } from './get-calendar-events';
import { getUserProfile } from './get-user-profile';
import { queryMemory } from './query-memory';
import { searchWeb } from './search-web';
import { sendEmail } from './send-email';

export const exampleActions: Record<
  string,
  Action<unknown, unknown, ExampleContext, Settings>
> = {
  call_llm: callLlm,
  get_user_profile: getUserProfile,
  search_web: searchWeb,
  query_memory: queryMemory,
  get_calendar_events: getCalendarEvents,
  await_user_input: awaitUserInput,
  decision_router: decisionRouter,
  create_ticket: createTicket,
  send_email: sendEmail,
};
