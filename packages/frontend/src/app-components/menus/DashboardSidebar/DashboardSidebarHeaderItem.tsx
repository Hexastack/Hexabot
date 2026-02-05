/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import ListSubheader from "@mui/material/ListSubheader";

import type {} from "@mui/material/themeCssVarsAugmentation";

import { useDashboardSidebar } from "./hooks/useDashboardSidebar";
import { DRAWER_WIDTH } from "./measurements.constansts";
import { getDrawerSxTransitionMixin } from "./mixins";
import { DashboardSidebarHeaderItemProps } from "./types/sidebar.types";

export const DashboardSidebarHeaderItem = ({
  children,
}: DashboardSidebarHeaderItemProps) => {
  const { mini, fullyExpanded, hasDrawerTransitions } = useDashboardSidebar();

  return (
    <ListSubheader
      sx={{
        px: 1.5,
        py: 0,
        zIndex: 2,
        fontSize: 12,
        fontWeight: 600,
        minWidth: DRAWER_WIDTH,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        alignContent: "center",
        height: mini ? 0 : 36,
        visibility: mini ? "hidden" : "visible",
        opacity: mini ? 0 : 1,
        ...(hasDrawerTransitions &&
          getDrawerSxTransitionMixin(fullyExpanded, "height")),
      }}
    >
      {children}
    </ListSubheader>
  );
};
