/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { parseServices } from '../services.js';

describe('parseServices', () => {
  it('splits and trims comma separated values', () => {
    expect(parseServices('api, postgres,worker')).toEqual([
      'api',
      'postgres',
      'worker',
    ]);
  });

  it('filters out empty service values', () => {
    expect(parseServices(' , , ')).toEqual([]);
  });
});
