/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Grid } from "@mui/material";
import { Workflow } from "@hexabot-ai/types";

import { useFind } from "@/hooks/crud/useFind";
import { EntityType } from "@/services/types";

import { PinnedWorkflowsCard } from "../components/PinnedWorkflowsCard";
import { TitleWithActions } from "../components/TitleWithActions";

export const PinnedWorkflows = () => {
  const { data: latestWorkflows } = useFind<Workflow>(
    { entity: EntityType.WORKFLOW },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "desc" }],
      initialPaginationState: { page: 0, pageSize: 3 },
    },
  );

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
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        {latestWorkflows.map((workflow) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={workflow.id}>
            <PinnedWorkflowsCard workflow={workflow} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
