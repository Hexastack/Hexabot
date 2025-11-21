/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { aMonthAgo } from './a-month-ago';

describe('aMonthAgo', () => {
  it('should test the date from one month ago', () => {
    const now = new Date();
    const result = aMonthAgo();

    expect(new Date(result.getTime())).toStrictEqual(
      new Date(now.setMonth(now.getMonth() - 1)),
    );
  });
});
