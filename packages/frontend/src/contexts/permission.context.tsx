/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createContext } from "react";

import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

export const PermissionContext = createContext<{
  getAllowedActions: (_type: EntityType) => undefined | PermissionAction[];
}>({
  getAllowedActions: (_type: EntityType) => undefined,
});

PermissionContext.displayName = "PermissionContext";
