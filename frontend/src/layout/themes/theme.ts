/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Color, SimplePaletteColorOptions } from "@mui/material";
import { grey, teal } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

import { roboto } from "@/pages/_app";

import { ChipStyles } from "./Chip";

declare module "@mui/material/styles" {
  interface PaletteOptions {
    teal: Partial<Color>;
    neutral: SimplePaletteColorOptions;
  }

  interface Palette {
    teal: Color;
    neutral: Palette["primary"];
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    disabled: true;
    enabled: true;
    title: true;
    role: true;
    inbox: true;
    test: true;
    available: true;
    unavailable: true;
    text: true;
  }
}

const defaultTheme = createTheme({});
const COLOR_PALETTE = {
  black: "#000",
  oceanGreen: "#1AA089",
  oliveGreen: "#96D445",
  lightGray: "#F5F6FA",
  lighterGray: "#f9fafc",
  borderGray: "#E0E0E0",
  gray: "#dcdfe6",
  darkCyanBlue: "#303133",
  disabledGray: "#f5f7fa",
  requiredRed: "#f56c6c",
  buttonBorder: "#c0c4cc",
  buttonBorderHover: "#afdb3d",
  buttonBorderFocus: " #04bade",
  buttonOutlinedColor: "#606266",
  buttonOutlinedBorder: "#dcdfe6",
  buttonOutlinedHover: "#eaf4f3",
};
const COLORS = {
  primary: {
    main: "#1AA089",
  },
  secondary: {
    main: "#B23A49",
  },
  error: {
    main: "#cc0000",
  },
  warning: {
    main: "#deb100",
  },
};

export const borderLine = `1.5px solid ${COLOR_PALETTE.borderGray}`;

export const theme = createTheme({
  typography: {
    fontFamily: [roboto.style.fontFamily, "sans-serif"].join(","),
    fontSize: 14,
  },
  palette: {
    ...COLORS,
    mode: "light",
    neutral: defaultTheme.palette.augmentColor({
      color: { main: "#838383" },
    }),
    background: {
      default: "#F5F6FA",
    },
    text: {
      secondary: "#71839B",
    },
    teal,
    grey,
  },
  shape: {
    borderRadius: 9,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          display: "flex",
          flexDirection: "column",
          borderRadius: "8px",
          backgroundColor: "#fff",
          [defaultTheme.breakpoints.up("sm")]: {
            flex: "auto",
          },
          [defaultTheme.breakpoints.up("md")]: {
            flex: "1",
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          marginBottom: "25px",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "0.5rem",
          borderTop: borderLine,
          backgroundColor: COLOR_PALETTE.lighterGray,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          borderBottom: borderLine,
          backgroundColor: COLOR_PALETTE.lighterGray,
          color: COLOR_PALETTE.darkCyanBlue,
          fontSize: "18px",
          lineHeight: "1",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          "& .MuiDialogTitle-root .MuiIconButton-root": {
            top: "10px",
            right: "10px",
            position: "absolute",
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { paddingTop: "15px!important" },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "36px",
            backgroundColor: "#fff",
          },
          "& .MuiInputBase-multiline ": {
            borderRadius: "12px",
          },
          "& .MuiInputBase-input.Mui-disabled": {
            borderRadius: "36px",
            backgroundColor: COLOR_PALETTE.disabledGray,
          },
          "& .MuiInputLabel-root.Mui-required": {
            "& .MuiFormLabel-asterisk": {
              color: COLOR_PALETTE.requiredRed,
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          padding: "7px 15px",
          borderRadius: "20px",
          textTransform: "uppercase",
          fontSize: "14px",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
      }`,
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "9px",
          boxShadow: "0px 4px 5.9px 0px rgba(0, 0, 0, 0.04)",
        },
      },
    },
    MuiChip: {
      variants: [
        ...Array.from(Object.entries(ChipStyles)).map(([key, value]) => ({
          props: { variant: key as keyof typeof ChipStyles },
          style: value,
        })),
        {
          props: {
            variant: "text",
          },
          style: {
            padding: "0 !important",
            color: "inherit",
            background: "transparent",
            "& .MuiChip-label": {
              lineHeight: 1,
              padding: "0 !important",
            },
          },
        },
      ],
    },
    MuiAlert: {
      styleOverrides: {
        standardError: {
          "&.custom-alert": {
            color: COLORS.error.main,
            svg: {
              fill: COLORS.error.main,
            },
          },
        },
        root: {
          "&.custom-alert": {
            textAlign: "center",
            background: "transparent",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
            minHeight: "300px",
            position: "relative",
            color: COLOR_PALETTE.buttonOutlinedColor,
            svg: {
              fill: COLOR_PALETTE.buttonOutlinedColor,
            },
          },
        },
      },
    },
  },
});
