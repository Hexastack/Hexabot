/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

export const aMonthAgo = (): Date =>
  new Date(new Date().setMonth(new Date().getMonth() - 1));
