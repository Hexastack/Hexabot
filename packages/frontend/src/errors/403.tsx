/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

export const Forbidden = () => {
  const { t } = useTranslate();

  return (
    <Grid
      container
      height="calc(100vh - 112px)"
      textAlign="center"
      flexDirection="column"
      justifyContent="center"
    >
      <Typography variant="h1" fontWeight={700}>
        403
      </Typography>
      <Typography variant="h6" color="gray">
        {t("message.forbidden")}
      </Typography>
    </Grid>
  );
};
