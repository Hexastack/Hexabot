/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { User } from '@hexabot-ai/types';
import type { Request } from 'express';

export type HexabotMcpRequest = Request & {
  user?: User;
  hexabotUser?: User;
  mcpTokenId?: string;
};
