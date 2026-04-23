/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import { createContext } from "react";

import { EntityType } from "@/services/types";

export const PermissionContext = createContext<{
  getAllowedActions: (_type: EntityType) => undefined | Action[];
}>({
  getAllowedActions: (_type: EntityType) => undefined,
});

PermissionContext.displayName = "PermissionContext";
