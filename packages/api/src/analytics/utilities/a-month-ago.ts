/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

/**
 * Gets the date from one month ago.
 *
 * This makes a new Date, moves it back by one month,
 * and returns that new date.
 *
 * @returns {Date} The date one month earlier.
 */
export const aMonthAgo = (): Date => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  return oneMonthAgo;
};
