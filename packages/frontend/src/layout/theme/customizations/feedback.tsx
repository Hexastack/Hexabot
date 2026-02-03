/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Components, Theme } from "@mui/material/styles";

import { theme } from "@/layout/themes/theme";

import { gray } from "../themePrimitives";

/* eslint-disable import/prefer-default-export */
export const feedbackCustomizations: Components<Theme> = {
  MuiAlert: {
    styleOverrides: {
      standardError: {
        "&.custom-alert": {
          color: theme.palette.error.main,
          svg: {
            fill: "transparent",
          },
        },
      },
      root: ({ theme }) => ({
        "&.custom-alert": {
          textAlign: "center",
          background: "transparent",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "300px",
          position: "relative",
          color: theme.palette.grey[500],
          svg: {
            fill: theme.palette.grey[500],
          },
          "& .MuiAlert-icon ": {
            marginRight: 0,
            padding: 0,
          },
        },
      }),
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: ({ theme }) => ({
        "& .MuiDialog-paper": {
          borderRadius: "10px",
          border: "1px solid",
          borderColor: (theme.vars || theme).palette.divider,
        },
      }),
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        "& .MuiIconButton-root": {
          top: "10px",
          right: "10px",
          position: "absolute",
          borderRadius: "50%",
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: ({ theme }) => ({
        height: 8,
        borderRadius: 8,
        backgroundColor: gray[200],
        ...theme.applyStyles("dark", {
          backgroundColor: gray[800],
        }),
      }),
    },
  },
};
