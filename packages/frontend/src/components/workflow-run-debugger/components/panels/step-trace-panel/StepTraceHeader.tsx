/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

export const StepTraceHeader = () => {
  const { t } = useTranslate();

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Typography variant="subtitle2" fontWeight={600}>
        {t("label.step_trace.title")}
      </Typography>
    </Box>
  );
};
