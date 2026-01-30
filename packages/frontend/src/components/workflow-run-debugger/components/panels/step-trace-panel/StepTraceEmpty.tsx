/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

type StepTraceEmptyProps = {
  hasSnapshot: boolean;
};

export const StepTraceEmpty = ({ hasSnapshot }: StepTraceEmptyProps) => {
  const { t } = useTranslate();

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100%"
      minHeight={120}
      color="text.secondary"
    >
      <Typography variant="body2">
        {hasSnapshot
          ? t("label.step_trace.empty")
          : t("label.step_trace.empty_no_snapshot")}
      </Typography>
    </Box>
  );
};
