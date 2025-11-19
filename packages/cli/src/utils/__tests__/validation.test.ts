/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { validateProjectName } from '../validation.js';

describe('validateProjectName', () => {
  it('accepts lowercase alphanumeric names with dashes', () => {
    expect(validateProjectName('hexabot-bot01')).toBe(true);
  });

  it('rejects names that do not start with a letter', () => {
    expect(validateProjectName('1hexabot')).toBe(false);
  });

  it('rejects names containing uppercase characters or spaces', () => {
    expect(validateProjectName('Hexabot Agent')).toBe(false);
  });
});
