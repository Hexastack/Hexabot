/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

import HexabotLogoRound from "../logos/HexabotLogoRound";

export const ChatWidgetHeader = () => {
  const { t } = useTranslate();

  return (
    <Box display="flex" alignItems="center" ml={2}>
      <HexabotLogoRound width={32} height={32} />
      <Typography component="h2" fontSize="1.25rem" ml={2}>
        {t("title.console")}
      </Typography>
    </Box>
  );
};
