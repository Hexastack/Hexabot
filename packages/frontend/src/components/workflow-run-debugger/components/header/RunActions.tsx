/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IconButton, Stack, Tooltip } from "@mui/material";
import { Copy, Download, PlayCircle, Trash2 } from "lucide-react";

export const RunActions = () => {
  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent={{ xs: "flex-start", lg: "flex-end" }}
      alignItems="center"
    >
      <Tooltip title="Follow live">
        <IconButton size="small" aria-label="Follow live">
          <PlayCircle size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Export trace (JSON)">
        <IconButton size="small" aria-label="Export trace">
          <Download size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy run ID">
        <IconButton size="small" aria-label="Copy run ID">
          <Copy size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Clear">
        <IconButton size="small" aria-label="Clear">
          <Trash2 size={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};
