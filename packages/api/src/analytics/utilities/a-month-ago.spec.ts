/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { aMonthAgo } from './a-month-ago';

describe('aMonthAgo', () => {
  const now = new Date('2025-12-08T08:49:00.841Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the date from one month ago', () => {
    const result = aMonthAgo();

    expect(result).toStrictEqual(new Date('2025-11-08T08:49:00.841Z'));
  });
});
