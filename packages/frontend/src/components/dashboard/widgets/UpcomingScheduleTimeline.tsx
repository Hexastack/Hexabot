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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        px={1}
      >
        <Typography variant="h6">Upcoming</Typography>
      </Box>
      {scheduledWorkflows.length ? (
        <Timeline
          position="right"
          sx={{
            width: "100%",
            padding: "0 0 16px 16px",
            margin: 0,
          }}
        >
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
        <Paper
          elevation={3}
          sx={{
            m: 0,
            p: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography>{t("label.no_scheduled_workflows")}</Typography>
        </Paper>
      )}
    </Box>
  );
};
