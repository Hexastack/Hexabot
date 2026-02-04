/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Divider from "@mui/material/Divider";
import * as React from "react";

import type {} from "@mui/material/themeCssVarsAugmentation";

import DashboardSidebarContext from "./context/dashboard-sidebar.context";
import { getDrawerSxTransitionMixin } from "./mixins";

export default function DashboardSidebarDividerItem() {
  const sidebarContext = React.useContext(DashboardSidebarContext);

  if (!sidebarContext) {
    throw new Error("Sidebar context was used without a provider.");
  }
  const { fullyExpanded = true, hasDrawerTransitions } = sidebarContext;

  return (
    <li>
      <Divider
        sx={{
          borderBottomWidth: 1,
          my: 1,
          mx: -0.5,
          ...(hasDrawerTransitions
            ? getDrawerSxTransitionMixin(fullyExpanded, "margin")
            : {}),
        }}
      />
    </li>
  );
}
