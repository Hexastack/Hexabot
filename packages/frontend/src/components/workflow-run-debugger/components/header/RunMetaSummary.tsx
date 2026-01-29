/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Chip, Stack, Typography } from "@mui/material";

type RunMetaSummaryProps = {
  workflowName: string;
  workflowVersionLabel?: string;
  initiatorName: string;
  workflowId?: string;
  initiatorId?: string;
};

export const RunMetaSummary = ({
  workflowName,
  workflowVersionLabel,
  initiatorName,
  workflowId,
  initiatorId,
}: RunMetaSummaryProps) => {
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="subtitle1" fontWeight={600}>
          Workflow: {workflowName}
        </Typography>
        {workflowVersionLabel ? (
          <Chip label={workflowVersionLabel} size="small" variant="outlined" />
        ) : null}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Initiator: {initiatorName}
      </Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Typography variant="caption" color="text.secondary">
          Workflow ID: {workflowId ?? "-"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Initiator ID: {initiatorId ?? "-"}
        </Typography>
      </Stack>
    </Stack>
  );
};
