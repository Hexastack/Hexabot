/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Components, Theme } from "@mui/material/styles";

import { gray } from "../themePrimitives";

/* eslint-disable import/prefer-default-export */
export const feedbackCustomizations: Components<Theme> = {
  MuiAlert: {
    styleOverrides: {
      standardError: {
        "&.custom-alert": {
          color: "main",
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
  // MuiDataGrid: {
  //   styleOverrides: {
  //     root: ({ theme }) => ({
  //       "--DataGrid-overlayHeight": "300px",
  //       overflow: "clip",
  //       borderColor: (theme.vars || theme).palette.divider,
  //       backgroundColor: (theme.vars || theme).palette.background.default,
  //       // [`& .${gridClasses.columnHeader}`]: {
  //       //   backgroundColor: (theme.vars || theme).palette.background.paper,
  //       // },
  //       // [`& .${gridClasses.footerContainer}`]: {
  //       //   backgroundColor: (theme.vars || theme).palette.background.paper,
  //       // },
  //       [`& .${checkboxClasses.root}`]: {
  //         padding: theme.spacing(0.5),
  //         "& > svg": {
  //           fontSize: "1rem",
  //         },
  //       },
  //       [`& .${tablePaginationClasses.root}`]: {
  //         marginRight: theme.spacing(1),
  //         "& .MuiIconButton-root": {
  //           maxHeight: 32,
  //           maxWidth: 32,
  //           "& > svg": {
  //             fontSize: "1rem",
  //           },
  //         },
  //       },
  //     }),
  //     cell: ({ theme }) => ({
  //       borderTopColor: (theme.vars || theme).palette.divider,
  //     }),
  //     menu: ({ theme }) => ({
  //       borderRadius: theme.shape.borderRadius,
  //       backgroundImage: "none",
  //       [`& .${paperClasses.root}`]: {
  //         border: `1px solid ${(theme.vars || theme).palette.divider}`,
  //       },

  //       [`& .${menuItemClasses.root}`]: {
  //         margin: "0 4px",
  //       },
  //       [`& .${listItemIconClasses.root}`]: {
  //         marginRight: 0,
  //       },
  //       [`& .${listClasses.root}`]: {
  //         paddingLeft: 0,
  //         paddingRight: 0,
  //       },
  //     }),

  //     row: ({ theme }) => ({
  //       "&:last-of-type": {
  //         borderBottom: `1px solid ${(theme.vars || theme).palette.divider}`,
  //       },
  //       "&:hover": {
  //         backgroundColor: (theme.vars || theme).palette.action.hover,
  //       },
  //       "&.Mui-selected": {
  //         background: (theme.vars || theme).palette.action.selected,
  //         "&:hover": {
  //           backgroundColor: (theme.vars || theme).palette.action.hover,
  //         },
  //       },
  //     }),
  //     iconButtonContainer: ({ theme }) => ({
  //       [`& .${iconButtonClasses.root}`]: {
  //         border: "none",
  //         backgroundColor: "transparent",
  //         "&:hover": {
  //           backgroundColor: alpha(theme.palette.action.selected, 0.3),
  //         },
  //         "&:active": {
  //           backgroundColor: gray[200],
  //         },
  //         ...theme.applyStyles("dark", {
  //           color: gray[50],
  //           "&:hover": {
  //             backgroundColor: gray[800],
  //           },
  //           "&:active": {
  //             backgroundColor: gray[900],
  //           },
  //         }),
  //       },
  //     }),
  //     menuIconButton: ({ theme }) => ({
  //       border: "none",
  //       backgroundColor: "transparent",
  //       "&:hover": {
  //         backgroundColor: gray[100],
  //       },
  //       "&:active": {
  //         backgroundColor: gray[200],
  //       },
  //       ...theme.applyStyles("dark", {
  //         color: gray[50],
  //         "&:hover": {
  //           backgroundColor: gray[800],
  //         },
  //         "&:active": {
  //           backgroundColor: gray[900],
  //         },
  //       }),
  //     }),
  //     filterForm: ({ theme }) => ({
  //       gap: theme.spacing(1),
  //       alignItems: "flex-end",
  //     }),
  //     columnsManagementHeader: ({ theme }) => ({
  //       paddingRight: theme.spacing(3),
  //       paddingLeft: theme.spacing(3),
  //     }),
  //     columnHeaderTitleContainer: {
  //       flexGrow: 1,
  //       justifyContent: "space-between",
  //     },
  //     columnHeaderDraggableContainer: { paddingRight: 2 },
  //     toolbar: ({ theme }) => ({
  //       backgroundColor: (theme.vars || theme).palette.background.paper,
  //     }),
  //     toolbarQuickFilter: {
  //       [`& .${inputBaseClasses.root}`]: {
  //         marginLeft: 6,
  //         marginRight: 6,
  //       },
  //       [`& .${iconButtonClasses.root}`]: {
  //         height: "36px",
  //         width: "36px",
  //       },
  //       [`& .${iconButtonClasses.edgeEnd}`]: {
  //         border: "none",
  //         height: "28px",
  //         width: "28px",
  //       },
  //     },
  //   },
  // },
};
