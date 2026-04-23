/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import { useCallback, useContext } from "react";

import { PermissionContext } from "@/contexts/permission.context";
import { EntityType } from "@/services/types";

export const useHasPermission = () => {
  const { getAllowedActions } = useContext(PermissionContext);
  const hasPermission = useCallback(
    (type: EntityType, action: Action) => {
      const allowedActions = getAllowedActions(type);

      return !!allowedActions && allowedActions?.includes(action);
    },
    [getAllowedActions],
  );

  return hasPermission;
};
