/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { useCallback, useContext } from "react";

import { PermissionContext } from "@/contexts/permission.context";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

export const useHasPermission = () => {
  const { getAllowedActions } = useContext(PermissionContext);
  const hasPermission = useCallback(
    (type: EntityType, action: PermissionAction) => {
      const allowedActions = getAllowedActions(type);

      return !!allowedActions && allowedActions?.includes(action);
    },
    [getAllowedActions],
  );

  return hasPermission;
};
