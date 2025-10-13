/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

// Query() will return true even if the query is not equal to "true"
export function booleanQueryValidator(booleanQueryAsString: string): boolean {
  switch (booleanQueryAsString) {
    case 'true':
      return true;
    default:
      return false;
  }
}
