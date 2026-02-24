/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PaperOwnProps } from "@mui/material";
import { alpha, Components, Interpolation, Theme } from "@mui/material/styles";
import { ChevronRightIcon } from "lucide-react";

import { gray } from "../themePrimitives";

const getPaperDefaultValues = (
  theme: Theme,
  elevation: PaperOwnProps["elevation"] = 2,
) => {
  return {
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[elevation],
  } satisfies Interpolation<{
    theme: Theme;
  }>;
};

export const surfacesCustomizations: Components<Theme> = {
  MuiAccordion: {
    defaultProps: {
      disableGutters: true,
      elevation: 0,
      square: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: "transparent",
        boxShadow: "none",
        border: `1px solid ${alpha(gray[200], 0.5)}`,
        borderRadius: theme.shape.borderRadius,
        overflow: "hidden",

        // remove the default top hairline
        "&::before": { display: "none" },

        // subtle hover (optional)
        transition: theme.transitions.create(["border-color"], {
          duration: theme.transitions.duration.shortest,
        }),
        "&:hover": {
          borderColor: alpha(gray[200], 0.8),
        },
        // ...theme.applyStyles("dark", {
        //   borderColor: alpha(gray[100], 0.05),
        // }),
      }),
    },
  },
  MuiAccordionSummary: {
    defaultProps: {
      expandIcon: <ChevronRightIcon size={16} />,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.shape.borderRadius,
        // chevron on the left
        flexDirection: "row-reverse",
        alignItems: "center",

        // compact header
        minHeight: 32,
        padding: 0,

        // smooth feel
        transition: theme.transitions.create(["background-color"], {
          duration: theme.transitions.duration.shortest,
        }),
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          borderRadius: theme.shape.borderRadius,
        },

        // keep height compact when expanded
        "&.Mui-expanded": { minHeight: 32 },
      }),
      content: ({ theme }) => ({
        margin: theme.spacing(1),
        // "&.Mui-expanded": { margin: 0 },
      }),
      expandIconWrapper: ({ theme }) => ({
        // because we reversed direction, this becomes the left icon
        margin: theme.spacing(0, 0, 0, 1),

        // smooth rotation
        transition: theme.transitions.create("transform", {
          duration: theme.transitions.duration.shortest,
        }),
        transform: "rotate(90deg)",
        "&.Mui-expanded": {
          transform: "rotate(-90deg)",
        },
      }),
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(1.5),
      }),
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 2,
    },
    variants: [
      {
        props: {
          variant: "spaced",
        },
        style: ({ theme }) => getPaperDefaultValues(theme),
      },
    ],
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
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(0, 1.5),
        zIndex: theme.zIndex.drawer + 1,
        ".MuiToolbar-root": {
          padding: theme.spacing(0),
        },
      }),
    },
    defaultProps: {
      elevation: 2,
    },
  },
};
