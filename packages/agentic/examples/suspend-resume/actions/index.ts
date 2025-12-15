/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { formatReply } from './format-reply';
import { waitForUser } from './wait-for-user';

export const suspendResumeActions = {
  wait_for_user: waitForUser,
  format_reply: formatReply,
};
