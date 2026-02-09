/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Grid } from "@mui/material";

import { PinnedWorkflowsCard } from "../components/PinnedWorkflowsCard";
import { TitleWithActions } from "../components/TitleWithActions";
import { mockPinnedWorkflows } from "../mockData";

export const PinnedWorkflows = () => {
  return (
    <Box>
      <TitleWithActions
        title="Pinned"
        actions={
          <Button size="small" variant="text">
            View All
          </Button>
        }
      />
      <Grid container spacing={2}>
        {mockPinnedWorkflows.map((wf) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={wf.id}>
            <PinnedWorkflowsCard workflow={wf} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
