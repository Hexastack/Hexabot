/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Chip, Tooltip, Typography } from "@mui/material";

import { VersionChip } from "@/app-components/displays/VersionChip";
import type { IWorkflowVersion } from "@/types/workfow-version.types";

type WorkflowMetaInfoProps = {
  isDraft: boolean;
  statusLabel: string;
  workflowVersion?: IWorkflowVersion | null;
  lastSavedLabel: string;
  lastSavedExact?: string;
};

export const WorkflowMetaInfo = ({
  isDraft,
  statusLabel,
  workflowVersion,
  lastSavedLabel,
  lastSavedExact,
}: WorkflowMetaInfoProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 0.75,
        rowGap: 0.25,
        minWidth: 0,
      }}
    >
      <Chip
        size="small"
        label={statusLabel}
        color={isDraft ? "warning" : "success"}
      />
      <VersionChip version={workflowVersion ?? null} />
      <Tooltip
        title={lastSavedExact ?? ""}
        arrow
        disableHoverListener={!lastSavedExact}
      >
        <Typography variant="caption" color="text.secondary">
          {lastSavedLabel}
        </Typography>
      </Tooltip>
    </Box>
  );
};
