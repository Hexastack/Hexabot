/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PermissionCreateDto } from '../dto/permission.dto';
import { Action } from '../types/action.type';

export const permissionModels = (
  model: string,
  role: string,
): PermissionCreateDto[] => {
  return [
    {
      model,
      action: Action.CREATE,
      role,
    },
    {
      model,
      action: Action.READ,
      role,
    },
    {
      model,
      action: Action.UPDATE,
      role,
    },
    {
      model,
      action: Action.DELETE,
      role,
    },
  ];
};
