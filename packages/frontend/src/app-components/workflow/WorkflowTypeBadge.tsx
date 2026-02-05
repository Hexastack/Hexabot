/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { WORKFLOW_TYPES } from "@/constants/workflow.constants";
import { useTranslate } from "@/hooks/useTranslate";
import type { IWorkflow } from "@/types/workfow.types";

type WorkflowTypeBadgeProps = {
  workflow: IWorkflow;
  selected?: boolean;
};

export const WorkflowTypeBadge = ({
  workflow,
  selected = true,
}: WorkflowTypeBadgeProps) => {
  const theme = useTheme();
  const { t } = useTranslate();
  const typeInfo = WORKFLOW_TYPES[workflow.type];

  if (!typeInfo) {
    return null;
  }

  const { icon: Icon, labelKey } = typeInfo;
  const label = t(labelKey);
  const resolvedColor = selected
    ? typeInfo.color
    : theme.palette.text.secondary;
  const resolvedBackground = selected
    ? typeInfo.background
    : alpha(resolvedColor, 0.12);

  return (
    <Tooltip title={label} arrow disableHoverListener={!label}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: (theme) => (theme.shape.borderRadius as number) + 1,
          flexShrink: 0,
          color: resolvedColor,
          backgroundColor: resolvedBackground,
        }}
      >
        <Icon size={18} />
      </Box>
    </Tooltip>
  );
};
