/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { buttonBaseClasses } from "@mui/material/ButtonBase";
import { iconButtonClasses } from "@mui/material/IconButton";
import { alpha, Components, Theme } from "@mui/material/styles";
import { svgIconClasses } from "@mui/material/SvgIcon";
import { typographyClasses } from "@mui/material/Typography";

/* eslint-disable import/prefer-default-export */
export const dataDisplayCustomizations: Components<Theme> = {
  MuiList: {
    styleOverrides: {
      root: {
        display: "flex",
        flexDirection: "column",
        gap: 0,
        paddingTop: 0,
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        [`& .${svgIconClasses.root}`]: {
          width: "1rem",
          height: "1rem",
          color: (theme.vars || theme).palette.text.secondary,
        },
        [`& .${typographyClasses.root}`]: {
          fontWeight: 500,
        },
        [`& .${buttonBaseClasses.root}`]: {
          display: "flex",
          gap: 8,
          padding: "2px 8px",
          borderRadius: (theme.vars || theme).shape.borderRadius,
          opacity: 0.7,
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          },
          "&.Mui-selected": {
            opacity: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            [`& .${svgIconClasses.root}`]: {
              color: (theme.vars || theme).palette.text.primary,
            },
            "&:focus-visible": {
              backgroundColor: alpha(theme.palette.action.selected, 0.3),
            },
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
            },
          },
          "&:focus-visible": {
            backgroundColor: "transparent",
          },
        },
      }),
    },
  },
  MuiListItemText: {
    styleOverrides: {
      primary: ({ theme }) => ({
        fontSize: theme.typography.body2.fontSize,
        fontWeight: 500,
        lineHeight: theme.typography.body2.lineHeight,
      }),
      secondary: ({ theme }) => ({
        fontSize: theme.typography.caption.fontSize,
        lineHeight: theme.typography.caption.lineHeight,
      }),
    },
  },
  MuiListSubheader: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: "transparent",
        padding: "4px 8px",
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 500,
        lineHeight: theme.typography.caption.lineHeight,
      }),
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 0,
        color: "red",
      },
    },
  },
  MuiChip: {
    defaultProps: {
      variant: "outlined",
    },
    variants: [
      {
        props: {
          size: "small",
          variant: "outlined",
        },
        style: {
          height: 18,
          fontSize: 10,
          fontWeight: 600,
          backgroundColor: "rgb(from currentColor r g b / 0.05)",
        },
      },
      {
        props: {
          size: "medium",
          variant: "outlined",
        },
        style: {
          fontWeight: 600,
          backgroundColor: "rgb(from currentColor r g b / 0.05)",
        },
      },
    ],
  },
  MuiTablePagination: {
    styleOverrides: {
      actions: {
        display: "flex",
        gap: 8,
        marginRight: 6,
        [`& .${iconButtonClasses.root}`]: {
          minWidth: 0,
          width: 36,
          height: 36,
        },
      },
    },
  },
  MuiIcon: {
    defaultProps: {
      fontSize: "small",
    },
    styleOverrides: {
      root: {
        variants: [
          {
            props: {
              fontSize: "small",
            },
            style: {
              fontSize: "1rem",
            },
          },
        ],
      },
    },
  },
};
