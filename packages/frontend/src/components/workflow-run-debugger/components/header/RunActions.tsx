/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IconButton, Stack, Tooltip } from "@mui/material";
import { Copy, Download, PlayCircle, Trash2 } from "lucide-react";

export const RunActions = () => {
  const followLiveLabel = "tooltip.follow_live";
  const exportTraceLabel = "tooltip.export_trace";
  const copyRunIdLabel = "tooltip.copy_run_id";
  const clearLabel = "tooltip.clear";

  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent={{ xs: "flex-start", lg: "flex-end" }}
      alignItems="center"
    >
      <Tooltip title={followLiveLabel}>
        <IconButton size="small" aria-label={followLiveLabel}>
          <PlayCircle size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title={exportTraceLabel}>
        <IconButton size="small" aria-label={exportTraceLabel}>
          <Download size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title={copyRunIdLabel}>
        <IconButton size="small" aria-label={copyRunIdLabel}>
          <Copy size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title={clearLabel}>
        <IconButton size="small" aria-label={clearLabel}>
          <Trash2 size={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};
