/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Grid, useMediaQuery } from "@mui/material";
import React from "react";

import { HexabotLogo } from "@/app-components/logos/HexabotLogo";
import DashboardHeader from "@/app-components/menus/DashboardSidebar/DashboardHeader";
import DashboardSidebar from "@/app-components/menus/DashboardSidebar/DashboardSidebar";
import useAvailableMenuItems from "@/hooks/useAvailableMenuItems";
import { useConfig } from "@/hooks/useConfig";
import { getMenuItems } from "@/utils/menu.util";
import { useSocketGetQuery } from "@/websocket/socket-hooks";

import { LayoutProps } from ".";

import { theme } from "./theme";

export const AuthenticatedLayout: React.FC<
  LayoutProps & { hasNoPadding?: boolean }
> = ({ children, hasNoPadding }) => {
  useSocketGetQuery("/message/subscribe/");

  useSocketGetQuery("/subscriber/subscribe/");

  useSocketGetQuery("/workflow/subscribe/");
  const { ssoEnabled } = useConfig();
  const [isDesktopNavigationExpanded, setIsDesktopNavigationExpanded] =
    React.useState(false);
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up("md"));
  const setIsNavigationExpanded = React.useCallback(
    (newExpanded: boolean) => {
      setIsDesktopNavigationExpanded(newExpanded);
    },
    [isOverMdViewport, setIsDesktopNavigationExpanded],
  );
  const layoutRef = React.useRef<HTMLDivElement>(null);
  const handleToggleHeaderMenu = React.useCallback(
    (isExpanded: boolean) => {
      setIsNavigationExpanded(isExpanded);
    },
    [setIsNavigationExpanded],
  );
  const menuItems = getMenuItems(ssoEnabled);
  const availableMenuItems = useAvailableMenuItems(menuItems);

  return (
    <Box ref={layoutRef}>
      <DashboardHeader
        logo={<HexabotLogo />}
        title=""
        menuOpen={isDesktopNavigationExpanded}
        onToggleMenu={handleToggleHeaderMenu}
      />
      <DashboardSidebar
        menu={availableMenuItems}
        expanded={isDesktopNavigationExpanded}
        setExpanded={setIsNavigationExpanded}
        container={layoutRef?.current ?? undefined}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          position: "absolute",
          width: "100%",
        }}
      >
        <Grid
          sx={{
            padding: hasNoPadding ? 0 : 3,
            position: "relative",
            top: "64px",
            height: "calc(100% - 64px)",
            display: "flex",
            left: "88px",
            flexDirection: "column",
            flex: 1,
            overflow: "auto",
            width: "calc(100% - 88px)",
            zIndex: 5,
          }}
        >
          {children}
        </Grid>
      </Box>
    </Box>
  );
};
