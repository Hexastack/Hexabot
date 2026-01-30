/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Stack, Typography } from "@mui/material";

import { VersionChip } from "@/app-components/displays/VersionChip";
import type { IWorkflowVersion } from "@/types/workfow-version.types";

type RunMetaSummaryProps = {
  workflowName: string;
  workflowVersion?: IWorkflowVersion | null;
};

export const RunMetaSummary = ({
  workflowName,
  workflowVersion,
}: RunMetaSummaryProps) => {
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="subtitle1" fontWeight={600}>
          {workflowName}
        </Typography>
        <VersionChip version={workflowVersion ?? null} />
      </Stack>
    </Stack>
  );
};
