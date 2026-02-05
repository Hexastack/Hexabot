/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Divider from "@mui/material/Divider";

import type {} from "@mui/material/themeCssVarsAugmentation";

import { useDashboardSidebar } from "./hooks/useDashboardSidebar";
import { getDrawerSxTransitionMixin } from "./mixins";

export const DashboardSidebarDividerItem = () => {
  const { fullyExpanded, hasDrawerTransitions, mini } = useDashboardSidebar();

  return (
    <li>
      <Divider
        sx={{
          my: 1,
          mx: mini ? 1 : -0.5, // Center the line better when collapsed
          borderBottomWidth: 1,
          transition: (theme) => theme.transitions.create(["margin"]),
          ...(hasDrawerTransitions &&
            getDrawerSxTransitionMixin(fullyExpanded, "margin")),
        }}
      />
    </li>
  );
};
