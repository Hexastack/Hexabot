/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DashboardSidebarContext } from "../context/dashboard-sidebar.context";
import { DashboardSidebarProviderProps } from "../types/sidebar.types";

export const DashboardSidebarProvider = ({
  children,
  ...rest
}: DashboardSidebarProviderProps) => {
  return (
    <DashboardSidebarContext.Provider value={rest}>
      {children}
    </DashboardSidebarContext.Provider>
  );
};
