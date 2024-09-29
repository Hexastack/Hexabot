/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, BoxProps, Grid, styled, Theme } from "@mui/material";
import { FC } from "react";

import { SXStyleOptions } from "@/utils/SXStyleOptions";

import { IContentPaddingProps } from "..";

const StyledBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasNoPadding",
})(({ hasNoPadding, theme }: IContentPaddingProps & { theme: Theme }) =>
  SXStyleOptions({
    padding: hasNoPadding ? "0" : 3,
    width: "calc(100% - 300px)",
    height: "auto",
    minHeight: "100vh",
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    display: hasNoPadding ? "flex" : "block",
    flexDirection: hasNoPadding ? "column" : "row",
  })({ theme }),
);
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

export type ContentProps = BoxProps & {
  children: JSX.Element;
} & IContentPaddingProps;
export const Content: FC<ContentProps> = ({ children, ...rest }) => (
  <StyledBox component="main" {...rest}>
    <Grid item xs>
      <DrawerHeader />
    </Grid>
    {children}
  </StyledBox>
);
