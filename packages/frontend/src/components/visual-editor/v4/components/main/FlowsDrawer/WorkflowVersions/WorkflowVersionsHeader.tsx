/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

export const WorkflowVersionsHeader = () => {
  const { t } = useTranslate();

  return (
    <Box px={2} pt={2} pb={1}>
      <Typography variant="subtitle2" fontWeight={600}>
        {t("visual_editor.workflow_versions.title")}
      </Typography>
    </Box>
  );
};
