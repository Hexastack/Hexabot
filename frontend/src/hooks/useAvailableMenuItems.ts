/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useMemo } from "react";

import { MenuItem } from "@/layout/VerticalMenu";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import { useHasPermission } from "./useHasPermission";

// Helper function to check permissions for a menu item
const isMenuItemAllowed = (
  menuItem: MenuItem,
  hasPermission: (entityType: EntityType, action: PermissionAction) => boolean,
): boolean => {
  const requiredPermissions = Object.entries(menuItem.requires || {});

  return (
    requiredPermissions.length === 0 ||
    requiredPermissions.every(([entityType, actions]) =>
      actions.every((action) =>
        hasPermission(entityType as EntityType, action),
      ),
    )
  );
};
const filterMenuItems = (
  menuItems: MenuItem[],
  hasPermission: (entityType: EntityType, action: PermissionAction) => boolean,
): MenuItem[] => {
  return menuItems
    .map((menuItem) => {
      // Validate top-level menu item without submenu
      if (
        menuItem &&
        !menuItem.submenuItems &&
        isMenuItemAllowed(menuItem, hasPermission)
      ) {
        return menuItem;
      }

      // Recursively process submenu items
      if (menuItem.submenuItems) {
        const filteredSubmenuItems = filterMenuItems(
          menuItem.submenuItems,
          hasPermission,
        );

        if (filteredSubmenuItems.length > 0) {
          return { ...menuItem, submenuItems: filteredSubmenuItems };
        }
      }

      return null; // Exclude invalid menu items
    })
    .filter((menuItem): menuItem is MenuItem => !!menuItem);
};
const useAvailableMenuItems = (menuItems: MenuItem[]): MenuItem[] => {
  const hasPermission = useHasPermission();

  return useMemo(() => {
    return filterMenuItems(menuItems, hasPermission);
  }, [menuItems, hasPermission]);
};

export default useAvailableMenuItems;
