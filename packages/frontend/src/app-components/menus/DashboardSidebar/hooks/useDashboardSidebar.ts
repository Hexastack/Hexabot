/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useContext } from "react";

import { DashboardSidebarContext } from "../context/dashboard-sidebar.context";

export const useDashboardSidebar = () => {
  const context = useContext(DashboardSidebarContext);

  if (!context) {
    throw new Error(
      "useDashboardSidebar must be used within a DashboardSidebarProvider",
    );
  }

  return context;
};
