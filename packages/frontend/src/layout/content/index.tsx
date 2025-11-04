/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Box,
  BoxProps,
  CircularProgress,
  Grid,
  styled,
  Theme,
  Typography,
} from "@mui/material";
import { FC } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useTranslate } from "@/hooks/useTranslate";
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
export const Content: FC<ContentProps> = ({ children, ...rest }) => {
  const { error } = useAuth();
  const { t } = useTranslate();
  const isNotAvailableApi = typeof error === "string" && error === "";

  if (isNotAvailableApi) {
    return (
      <Grid
        container
        gap="10px"
        top="0"
        bottom="0"
        height="100%"
        bgcolor="#F5F6FA"
        position="fixed"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <CircularProgress />
        <Typography display="block">{t("message.wait_message")} ...</Typography>
      </Grid>
    );
  }

  return (
    <StyledBox component="main" {...rest}>
      <Grid item xs>
        <DrawerHeader />
      </Grid>
      {children}
    </StyledBox>
  );
};
