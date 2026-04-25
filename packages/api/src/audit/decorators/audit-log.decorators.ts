/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AuditLog } from 'nestjs-auditlog';

export const AuditAuthLogin = () =>
  AuditLog({
    resource: {
      type: 'Auth',
    },
    operation: {
      id: 'auth.login',
      type: 'Login',
    },
    resource_id_field_map: '$response.id',
    actor_id_field_map: '$response.id',
    actor_type_field_map: '$response.roles',
  });

export const AuditAuthLogout = () =>
  AuditLog({
    resource: {
      type: 'Auth',
    },
    operation: {
      id: 'auth.logout',
      type: 'Logout',
    },
    resource_id_field_map: 'session.passport.user.id',
    actor_id_field_map: 'session.passport.user.id',
    actor_type_field_map: 'user.roles',
  });
