/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import { Header } from "@/layout/Header";

export const ServerError = () => {
  const { t } = useTranslate();

  return (
    <>
      <Header />
      <Grid
        container
        height="100vh"
        paddingTop="65px"
        textAlign="center"
        flexDirection="column"
        justifyContent="center"
      >
        <Typography variant="h1" fontWeight={700}>
          500
        </Typography>
        <Typography variant="h6" color="gray">
          {t("message.server_error")}
        </Typography>
      </Grid>
    </>
  );
};
