/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type EntityWithFullName = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string;
};

const normalizeNamePart = (value?: string | null) => value?.trim() ?? "";

export const getFullName = (entity?: EntityWithFullName | null) => {
  if (!entity) {
    return "";
  }

  const explicitFullName = normalizeNamePart(entity.fullName);

  if (explicitFullName) {
    return explicitFullName;
  }

  return [
    normalizeNamePart(entity.firstName),
    normalizeNamePart(entity.lastName),
  ]
    .filter(Boolean)
    .join(" ");
};

export const applyFullNameDerivedFields = <T extends EntityWithFullName>(
  entity: T,
): T => {
  entity.fullName = getFullName(entity) || undefined;

  return entity;
};
