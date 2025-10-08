/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

export const getDelayedDate = (delay: number) => {
  const date = new Date();
  return new Date(date.setSeconds(date.getSeconds() + delay));
};
