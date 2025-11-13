/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Transform } from 'class-transformer';

export interface AsRelationOptions {
  /** primary key field name inside the object (default: "id") */
  idKey?: string;
  /** handle arrays of ids/objects (default: true) */
  allowArray?: boolean;
}

export function AsRelation(opts: AsRelationOptions = {}): PropertyDecorator {
  const idKey = opts.idKey ?? 'id';
  const allowArray = opts.allowArray ?? true;
  const toObj = (v: any) =>
    typeof v === 'string' || typeof v === 'number' ? { [idKey]: v } : v;

  return Transform(({ value }) => {
    if (value == null) return value;
    if (allowArray && Array.isArray(value)) return value.map(toObj);

    return toObj(value);
  });
}
