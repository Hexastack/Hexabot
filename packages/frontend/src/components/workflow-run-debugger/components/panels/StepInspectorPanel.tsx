/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Paper, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";

export const StepInspectorPanel = () => {
  return (
    <Grid size={{ xs: 12, lg: 5 }}>
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Step Inspector
        </Typography>
        <Box
          sx={{
            flex: 1,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
            backgroundColor: "background.default",
            p: 2,
          }}
        />
      </Paper>
    </Grid>
  );
};
