/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Box,
  Drawer,
  InputBase,
  ListItemButton,
  styled,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { collapsedWidth, drawerWidth } from "./constants";

export const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: open ? drawerWidth : collapsedWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  height: "100%",
  "& .MuiDrawer-paper": {
    width: open ? drawerWidth : collapsedWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: open
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
    position: "relative",
    height: "100%",
    overflowX: "hidden",
    borderRight: "1px solid #e3e5e8",
    backgroundColor: "#f7f8fa",
  },
  [theme.breakpoints.down("md")]: {
    width: open ? 280 : 56,
    "& .MuiDrawer-paper": {
      width: open ? 280 : 56,
    },
  },
}));

export const DrawerHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 12px 8px 16px",
  minHeight: 48,
}));

export const SearchBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #d5d8dc",
  backgroundColor: "#fff",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  "&:focus-within": {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
  },
}));

export const SearchInput = styled(InputBase)(() => ({
  fontSize: 13,
  flex: 1,
}));

export const ListContainer = styled(Box)(() => ({
  flex: 1,
  overflowY: "auto",
  padding: "0 8px 12px",
}));

export const FlowItem = styled(ListItemButton)(() => ({
  borderRadius: 10,
  padding: "10px 12px",
  alignItems: "flex-start",
  gap: 8,
  "&.Mui-selected": {
    backgroundColor: "#eaf1f1",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "#e3eded",
  },
  "& .flow-row-actions": {
    opacity: 0,
    pointerEvents: "none",
    transition: "opacity 0.15s ease",
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

export const HighlightMark = styled("mark")(() => ({
  backgroundColor: "#ffe7a8",
  borderRadius: 2,
  padding: "0 1px",
}));
