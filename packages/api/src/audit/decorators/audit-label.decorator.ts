/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import 'reflect-metadata';

import { EntityMetadata } from 'typeorm';

const AUDIT_LABEL_METADATA_KEY = Symbol('hexabot:audit-label');

export const AuditLabel = (): PropertyDecorator => {
  return (target, propertyKey) => {
    if (typeof propertyKey === 'string') {
      Reflect.defineMetadata(
        AUDIT_LABEL_METADATA_KEY,
        propertyKey,
        target.constructor,
      );
    }
  };
};

export const getAuditLabelProperty = (
  metadata: EntityMetadata,
): string | undefined => {
  const target = metadata.target;

  if (typeof target !== 'function') {
    return undefined;
  }

  const labelProperty = Reflect.getMetadata(AUDIT_LABEL_METADATA_KEY, target);

  return typeof labelProperty === 'string' ? labelProperty : undefined;
};
