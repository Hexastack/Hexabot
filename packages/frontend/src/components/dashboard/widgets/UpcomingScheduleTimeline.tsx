/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Timeline } from "@mui/lab";
import { Box, Grid, Paper, Typography } from "@mui/material";

import { WORKFLOW_TYPES } from "@/constants/workflow.constants";
import { useFind } from "@/hooks/crud/useFind";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { WorkflowType } from "@/types/workfow.types";
import { getRemainingTime } from "@/utils/date";

import { DashboardTimelineItem } from "../components/DashboardTimelineItem";
import { IconContainer } from "../components/IconContainer";

export const UpcomingScheduleTimeline = () => {
  const { t } = useTranslate();
  const router = useAppRouter();
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
              <DashboardTimelineItem
                key={scheduledWorkflow.id}
                author={scheduledWorkflow.schedule || ""}
                description={scheduledWorkflow.description || ""}
                time={getRemainingTime(scheduledWorkflow.runAfterMs)}
                getTitle={() => {
                  const { key: _, ...rest } =
                    WORKFLOW_TYPES[scheduledWorkflow.type];

                  return (
                    <>
                      <Grid display="flex" gap={1} alignItems="center">
                        <IconContainer
                          borderRadius="50%"
                          padding="2px"
                          {...rest}
                        />
                        <Typography variant="h6">
                          {scheduledWorkflow.name}
                        </Typography>
                      </Grid>
                    </>
                  );
                }}
                onClick={() => {
                  router.push({
                    pathname: `/workflow-editor/${scheduledWorkflow.id}`,
                  });
                }}
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
