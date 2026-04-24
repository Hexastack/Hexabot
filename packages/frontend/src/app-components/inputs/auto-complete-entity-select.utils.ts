/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const buildAutoCompleteEntityWhere = ({
  where,
  searchOrClauses,
}: {
  where?: Record<string, unknown>;
  searchOrClauses?: unknown[];
}) => {
  return {
    ...(where || {}),
    ...(searchOrClauses?.length
      ? {
          or: searchOrClauses,
        }
      : {}),
  };
};
