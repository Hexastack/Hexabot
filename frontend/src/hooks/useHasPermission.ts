/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
