/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Action, Settings } from '../../../src';
import type { LoopExampleContext } from '../context';

import { awaitReply } from './await-reply';
import { sendTextMessage } from './send-text-message';

export const loopExampleActions: Record<
  string,
  Action<unknown, unknown, LoopExampleContext, Settings>
> = {
  send_text_message: sendTextMessage,
  await_reply: awaitReply,
};
