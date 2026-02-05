/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { alpha, Components, Theme } from "@mui/material/styles";

import { gray } from "../themePrimitives";

/* eslint-disable import/prefer-default-export */
export const surfacesCustomizations: Components<Theme> = {
  MuiAccordion: {
    defaultProps: {
      elevation: 0,
      disableGutters: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        padding: 4,
        overflow: "clip",
        backgroundColor: (theme.vars || theme).palette.background.default,
        border: "1px solid",
        borderColor: (theme.vars || theme).palette.divider,
        ":before": {
          backgroundColor: "transparent",
        },
        "&:not(:last-of-type)": {
          borderBottom: "none",
        },
        "&:first-of-type": {
          borderTopLeftRadius: (theme.vars || theme).shape.borderRadius,
          borderTopRightRadius: (theme.vars || theme).shape.borderRadius,
        },
        "&:last-of-type": {
          borderBottomLeftRadius: (theme.vars || theme).shape.borderRadius,
          borderBottomRightRadius: (theme.vars || theme).shape.borderRadius,
        },
      }),
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: ({ theme }) => ({
        border: "none",
        borderRadius: 8,
        "&:hover": { backgroundColor: gray[100] },
        "&:focus-visible": { backgroundColor: "transparent" },
        ...theme.applyStyles("dark", {
          "&:hover": { backgroundColor: gray[800] },
        }),
      }),
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: { mb: 20, border: "none" },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 2,
      square: false,
      variant: "outlined",
    },
    styleOverrides: {
      root: ({ theme }) => ({
        boxShadow: `${alpha(theme.palette.grey[500], 0.05)} 0px 5px 15px 0px, ${alpha(theme.palette.grey[600], 0.05)} 0px 15px 35px -5px`,
        variants: [
          {
            props: {
              elevation: 3,
            },
            style: {
              padding: theme.spacing(3),
              ...theme.applyStyles("dark", {
                boxShadow: `${alpha(theme.palette.grey[50], 0.05)} 0px 5px 15px 0px, ${alpha(theme.palette.grey[100], 0.05)} 0px 15px 35px -5px`,
              }),
            },
          },
        ],
        // //Action schema
        // "> .MuiBox-root": {
        //   padding: 0,
        // },
      }),
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => {
        return {
          padding: 16,
          gap: 16,
          transition: "all 100ms ease",
          backgroundColor: gray[50],
          borderRadius: (theme.vars || theme).shape.borderRadius,
          border: `1px solid ${(theme.vars || theme).palette.divider}`,
          boxShadow: "none",
          ...theme.applyStyles("dark", {
            backgroundColor: gray[800],
          }),
          variants: [
            {
              props: {
                variant: "outlined",
              },
              style: {
                border: `1px solid ${(theme.vars || theme).palette.divider}`,
                boxShadow: "none",
                background: "hsl(0, 0%, 100%)",
                ...theme.applyStyles("dark", {
                  background: alpha(gray[900], 0.4),
                }),
              },
            },
          ],
        };
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 0,
        "&:last-child": { paddingBottom: 0 },
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  MuiCardActions: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
};
