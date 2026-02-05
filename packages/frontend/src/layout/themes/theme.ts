/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Color, SimplePaletteColorOptions } from "@mui/material";
import { grey, teal } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

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
    main: teal.A700,
    contrastText: "#FFF",
  },
  secondary: {
    main: "#B23A49",
  },
  error: {
    main: "#cc0000",
  },
  warning: {
    main: "#f59e0b",
  },
};

export const borderLine = `1.5px solid ${COLOR_PALETTE.borderGray}`;

export const theme = createTheme({
  typography: {
    fontFamily: ["Roboto", "sans-serif"].join(","),
    fontSize: 10,
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
    MuiAccordion: {
      styleOverrides: {
        root: {
          margin: 0,
          "&:before": {
            display: "none",
          },
          "&.Mui-expanded": {
            margin: 0,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: "36px",
          padding: "0 1rem",
          "&.Mui-expanded": {
            marginTop: "1rem",
            minHeight: "36px",
          },
          background: `linear-gradient(135deg, ${teal[500]} 0%, ${defaultTheme.alpha(teal.A700, 0.95)} 100%)`,
          borderRadius: "8px",
          color: "#FFF",
        },
        content: {
          margin: "6px 0",
          "&.Mui-expanded": {
            margin: "6px 0",
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: "0 8px 8px",
          "& .MuiButtonBase-root": {
            background: grey.A100,
            color: "#000",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#fff",
          },
          "& .MuiInputBase-input.Mui-disabled": {
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
