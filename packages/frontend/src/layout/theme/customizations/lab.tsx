/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Components, Theme } from "@mui/material/styles";

export const labCustomizations: Components<Theme> = {
  MuiTimeline: {
    styleOverrides: {
      root: {
        margin: 0,
        padding: 0,
      },
    },
  },
  MuiTimelineItem: {
    styleOverrides: {
      root: {
        "&:before": {
          display: "none",
        },
      },
    },
  },
  MuiTimelineDot: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
      }),
    },
  },
  MuiTimelineContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        "&.MuiTypography-root>p": {
          color: theme.palette.primary.main,
          textTransform: "capitalize",
          fontWeight: 700,
          paddingBottom: theme.spacing(1),
        },
        "& .MuiPaper-root": {
          padding: theme.spacing(1),
          border: "1px solid transparent",
          transition: ".2s",
          "& .MuiBox-root": {
            span: { color: theme.palette.text.secondaryChannel },
            p: { color: theme.palette.text.secondary },
          },
          "&:hover": {
            borderColor: theme.palette.primary.main,
            cursor: "pointer",
            marginLeft: "2px",
          },
        },
      }),
    },
  },
};
