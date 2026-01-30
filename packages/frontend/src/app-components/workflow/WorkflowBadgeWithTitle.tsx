/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Typography } from "@mui/material";

import { WORKFLOW_TYPES } from "@/constants/workflow.constants";
import type { IWorkflow } from "@/types/workfow.types";

import { WorkflowTypeBadge } from "./WorkflowTypeBadge";

export type WorkflowBadgeWithTitleProps = {
  workflow?: IWorkflow | null;
};

export const WorkflowBadgeWithTitle = ({ workflow }: WorkflowBadgeWithTitleProps) => {
  if (!workflow) {
    return null;
  }

  const typeInfo = WORKFLOW_TYPES[workflow.type];

  if (!typeInfo) {
    return null;
  }

  return (
    <Box gap={1} display="flex" height="100%" alignItems="stretch">
      <Box display="flex" alignItems="center" justifyContent="center">
        <WorkflowTypeBadge workflow={workflow} />
      </Box>
      <Box display="flex" alignItems="center" justifyContent="center">
        <Typography
          variant="subtitle2"
          fontWeight={500}
          textTransform="capitalize"
          noWrap
        >
          {workflow.name}
        </Typography>
      </Box>
    </Box>
  );
};
