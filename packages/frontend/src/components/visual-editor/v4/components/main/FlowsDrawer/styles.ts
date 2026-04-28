/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Drawer, ListItemButton, styled } from "@mui/material";
import { alpha } from "@mui/material/styles";

type StyledDrawerProps = {
  open: boolean;
  drawerWidth: number;
  collapsedWidth: number;
};

type DrawerResizerProps = {
  disabled?: boolean;
};

export const LeftSideFlowDrawer = styled(Drawer, {
  shouldForwardProp: (prop) =>
    prop !== "open" && prop !== "drawerWidth" && prop !== "collapsedWidth",
})<StyledDrawerProps>(({ theme, open, drawerWidth, collapsedWidth }) => ({
  width: open ? drawerWidth : collapsedWidth,
  "& .MuiDrawer-paper": {
    width: open ? drawerWidth : collapsedWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: open
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
    position: "relative",
  },
}));

export const FlowDrawerHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(1.5, 1.5, 1, 1.5),
  minHeight: theme.spacing(6),
}));

export const DrawerBody = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
}));

export const YamlEditorContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
}));

export const FlowDrawerResizer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "disabled",
})<DrawerResizerProps>(({ theme, disabled }) => ({
  position: "absolute",
  top: 0,
  right: 0,
  height: "100%",
  width: theme.spacing(0.75),
  cursor: disabled ? "default" : "col-resize",
  zIndex: 2,
  pointerEvents: disabled ? "none" : "auto",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    right: theme.spacing(0.25),
    width: theme.spacing(0.25),
    height: "100%",
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    opacity: 0,
    transition: theme.transitions.create("opacity", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  "&:hover::after": {
    opacity: 1,
  },
}));

export const FlowListContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(0, 1, 1.5),
}));

export const FlowItem = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.spacing(1.25),
  padding: theme.spacing(1.25, 1.5),
  alignItems: "flex-start",
  gap: theme.spacing(1),
  "&.Mui-selected": {
    backgroundColor: alpha(
      theme.palette.primary.main,
      theme.palette.action.selectedOpacity,
    ),
  },
  "&.Mui-selected:hover": {
    backgroundColor: alpha(
      theme.palette.primary.main,
      theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity,
    ),
  },
  "& .flow-row-actions": {
    opacity: 0,
    pointerEvents: "none",
    transition: theme.transitions.create("opacity", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  "&:hover .flow-row-actions": {
    opacity: 1,
    pointerEvents: "auto",
  },
  "&.Mui-selected .flow-row-actions": {
    opacity: 1,
    pointerEvents: "auto",
  },
}));

export const FlowSeachResultHighlightMark = styled("mark")(({ theme }) => ({
  backgroundColor: alpha(theme.palette.warning.light, 0.4),
  borderRadius: theme.spacing(0.25),
  padding: theme.spacing(0, 0.125),
}));
