/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

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
  const theme = useTheme();
  const statusColor = isDraft
    ? theme.palette.warning.main
    : theme.palette.success.main;
  const statusBorder = alpha(statusColor, 0.4);
  const styles = {
    metaContainer: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 0.75,
      rowGap: 0.25,
      minWidth: 0,
    },
    statusChip: {
      height: 18,
      fontSize: 10,
      fontWeight: 600,
      border: "1px solid",
      backgroundColor: "transparent",
    },
  };

  return (
    <Box sx={styles.metaContainer}>
      <Chip
        size="small"
        label={statusLabel}
        sx={[
          styles.statusChip,
          { color: statusColor, borderColor: statusBorder },
        ]}
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
