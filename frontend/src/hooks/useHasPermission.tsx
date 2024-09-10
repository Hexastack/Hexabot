/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { Progress } from "@/app-components/displays/Progress";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import { useUserPermissions } from "./entities/auth-hooks";

const PermissionContext = createContext<{
  getAllowedActions: (_type: EntityType) => undefined | PermissionAction[];
}>({
  getAllowedActions: (_type: EntityType) => undefined,
});

PermissionContext.displayName = "PermissionContext";

export interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider = ({
  children,
}: PermissionProviderProps): JSX.Element => {
  const { data, isLoading } = useUserPermissions();
  const permissionMap = useMemo(
    () =>
      data?.permissions.reduce((acc, { model, action }) => {
        if (!(model in acc)) {
          acc[model] = [];
        }

        acc[model]?.push(action);

        return acc;
      }, {} as { [key in EntityType]?: PermissionAction[] }),
    [data?.permissions],
  );
  const getAllowedActions = useCallback(
    (type: EntityType) => {
      return permissionMap && type in permissionMap ? permissionMap[type] : [];
    },
    [permissionMap],
  );

  if (isLoading) return <Progress />;

  return (
    <PermissionContext.Provider
      value={{
        getAllowedActions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const useHasPermission = () => {
  const { getAllowedActions } = useContext(PermissionContext);
  const hasPermission = useCallback(
    (type: EntityType, action: PermissionAction) => {
      const allowedActions = getAllowedActions(type);

      return allowedActions?.includes(action);
    },
    [getAllowedActions],
  );

  return hasPermission;
};
