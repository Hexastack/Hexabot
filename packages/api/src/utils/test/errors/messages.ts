/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const getUpdateOneError = (entity: string, id?: string) =>
  new Error(`Unable to update ${entity}${id ? ` with ID \"${id}\"` : ''}`);
