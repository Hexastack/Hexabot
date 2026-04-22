/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Workflow } from "@hexabot-ai/types";
import { Box, Typography } from "@mui/material";

import { WORKFLOW_TYPES } from "@/constants/workflow.constants";

import { BadgeWithTitleProps } from "../displays/Badge";

import { WorkflowTypeBadge } from "./WorkflowTypeBadge";

export type WorkflowBadgeWithTitleProps = BadgeWithTitleProps & {
  workflow?: Workflow | null;
};

export const WorkflowBadgeWithTitle = ({
  workflow,
  ...rest
}: WorkflowBadgeWithTitleProps) => {
  if (!workflow) {
    return null;
  }

  const typeInfo = WORKFLOW_TYPES[workflow.type];

  if (!typeInfo) {
    return null;
  }

  return (
    <Box gap={1} display="flex" alignItems="stretch">
      <Box display="flex" alignItems="center" justifyContent="center">
        <WorkflowTypeBadge workflow={workflow} {...rest} />
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
