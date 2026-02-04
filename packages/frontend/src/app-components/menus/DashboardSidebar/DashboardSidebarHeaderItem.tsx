/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import ListSubheader from "@mui/material/ListSubheader";
import * as React from "react";

import type {} from "@mui/material/themeCssVarsAugmentation";

import DashboardSidebarContext from "./context/dashboard-sidebar.context";
import { DRAWER_WIDTH } from "./DashboardSidebar";
import { getDrawerSxTransitionMixin } from "./mixins";

export interface DashboardSidebarHeaderItemProps {
  children?: React.ReactNode;
}

export default function DashboardSidebarHeaderItem({
  children,
}: DashboardSidebarHeaderItemProps) {
  const sidebarContext = React.useContext(DashboardSidebarContext);

  if (!sidebarContext) {
    throw new Error("Sidebar context was used without a provider.");
  }
  const {
    mini = false,
    fullyExpanded = true,
    hasDrawerTransitions,
  } = sidebarContext;

  return (
    <ListSubheader
      sx={{
        fontSize: 12,
        fontWeight: "600",
        height: mini ? 0 : 36,
        ...(hasDrawerTransitions
          ? getDrawerSxTransitionMixin(fullyExpanded, "height")
          : {}),
        px: 1.5,
        py: 0,
        minWidth: DRAWER_WIDTH,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        zIndex: 2,
        alignContent: "center",
      }}
    >
      {children}
    </ListSubheader>
  );
}
