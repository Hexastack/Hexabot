/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType } from "@/services/types";

import { PermissionAction } from "../permission.types";
import { IRole } from "../role.types";

export interface IUserPermissions {
  roles: IRole[];
  permissions: Array<{
    action: PermissionAction;
    model: EntityType;
    relation: string;
  }>;
}
