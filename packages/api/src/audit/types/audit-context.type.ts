/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type AuditRequestContext = {
  requestId?: string;
  actorId?: string;
  actorType?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
};

export type AuditClsStore = {
  audit?: AuditRequestContext;
};
