/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import { useMemo } from "react";

import { TMenu } from "@/app-components/menus/DashboardSidebar/types/sidebar.types";
import { EntityType } from "@/services/types";

import { useHasPermission } from "./useHasPermission";

/**
 * Helper function to check permissions for a menu item
 * @param menuItem - The menu item
 * @param hasPermission - Callback function
 * @returns True if hasPermission() is true for all required permissions.
 */
const isMenuItemAllowed = (
  menuItem: TMenu,
  hasPermission: (entityType: EntityType, action: Action) => boolean,
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
/**
 * Filters menu items based on user permissions.
 * @param menuItems - The list of menu items to filter.
 * @returns A filtered list of menu items that the user is allowed to access.
 */
const filterMenuItems = (
  menuItems: TMenu[],
  hasPermission: (entityType: EntityType, action: Action) => boolean,
): TMenu[] => {
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
    .filter((menuItem): menuItem is TMenu => !!menuItem);
};
const useAvailableMenuItems = (menuItems: TMenu[]): TMenu[] => {
  const hasPermission = useHasPermission();

  return useMemo(() => {
    return filterMenuItems(menuItems, hasPermission);
  }, [menuItems, hasPermission]);
};

export default useAvailableMenuItems;
