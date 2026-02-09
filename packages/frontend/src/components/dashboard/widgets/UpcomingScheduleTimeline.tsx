/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Timeline } from "@mui/lab";
import { Box, Paper, Typography } from "@mui/material";

import { useFind } from "@/hooks/crud/useFind";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { WorkflowType } from "@/types/workfow.types";

import { UpcomingScheduleTimelineItem } from "../components/UpcomingScheduleTimelineItem";

export const UpcomingScheduleTimeline = () => {
  const { t } = useTranslate();
  const { data: scheduledWorkflows } = useFind(
    { entity: EntityType.WORKFLOW },
    {
      params: { where: { type: WorkflowType.scheduled } },
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "desc" }],
      initialPaginationState: {
        page: 0,
        pageSize: 5,
      },
    },
  );

  return (
    <Box>
      <Typography variant="h6">Upcoming</Typography>
      {scheduledWorkflows.length ? (
        <Timeline position="right">
          {scheduledWorkflows
            .sort((s1, s2) =>
              (s1.runAfterMs || 0) > (s2.runAfterMs || 0) ? 1 : -1,
            )
            .map((scheduledWorkflow) => (
              <UpcomingScheduleTimelineItem
                key={scheduledWorkflow.id}
                scheduledWorkflow={scheduledWorkflow}
              />
            ))}
        </Timeline>
      ) : (
        <Paper elevation={3} variant="spaced" sx={{ mt: 1 }}>
          <Typography>{t("label.no_scheduled_workflows")}</Typography>
        </Paper>
      )}
    </Box>
  );
};
