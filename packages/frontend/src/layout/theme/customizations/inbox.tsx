/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { alpha, Components, Theme } from "@mui/material/styles";

export const inboxCustomizations: Components<Theme> = {
  MuiPaper: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&[data-inbox-sidebar="true"]': {
          borderRadius: 0,
          borderRight: `1px solid ${(theme.vars || theme).palette.divider}`,
          borderLeft: 0,
          borderTop: 0,
          borderBottom: 0,
          boxShadow: "none",
          backgroundColor: (theme.vars || theme).palette.background.paper,
        },
      }),
    },
  },
  MuiList: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&[data-inbox-conversations-list="true"]': {
          height: "100%",
          overflow: "auto",
          padding: theme.spacing(0.5, 1),
          paddingTop: 0,
          backgroundColor: (theme.vars || theme).palette.background.default,
        },
      }),
    },
  },
  MuiListSubheader: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&[data-inbox-list-subheader="true"]': {
          position: "sticky",
          top: 0,
          zIndex: 1,
          padding: theme.spacing(1, 1),
          borderBottom: `1px solid ${(theme.vars || theme).palette.divider}`,
          backgroundColor: (theme.vars || theme).palette.background.default,
        },
      }),
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        '&[data-inbox-conversation-item-wrapper="true"]': {
          display: "block",
        },
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&[data-inbox-conversation-item="true"]': {
          borderRadius: (theme.vars || theme).shape.borderRadius,
          alignItems: "center",
          gap: theme.spacing(1),
          padding: theme.spacing(1, 1.25),
          marginBottom: theme.spacing(0.5),
          transition: theme.transitions.create(
            ["background-color", "border-color"],
            {
              duration: theme.transitions.duration.shortest,
            },
          ),
          border: `1px solid transparent`,
          "&:hover": {
            borderColor: alpha(theme.palette.primary.main, 0.3),
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
          "&.Mui-selected": {
            borderColor: alpha(theme.palette.primary.main, 0.4),
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.16),
            },
          },
        },
      }),
    },
  },
  MuiListItemAvatar: {
    styleOverrides: {
      root: {
        '&[data-inbox-conversation-avatar="true"]': {
          minWidth: 0,
        },
      },
    },
  },
  MuiListItemText: {
    styleOverrides: {
      root: {
        '&[data-inbox-conversation-text="true"]': {
          margin: 0,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&[data-inbox-channel-chip="true"]': {
          fontWeight: theme.typography.fontWeightMedium,
          borderColor: alpha(theme.palette.text.primary, 0.2),
        },
      }),
    },
  },
};
