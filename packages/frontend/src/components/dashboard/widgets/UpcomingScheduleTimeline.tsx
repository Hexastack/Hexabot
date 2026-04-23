/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowType } from "@hexabot-ai/types";
import { Timeline } from "@mui/lab";
import { Box, Grid, Paper, Typography } from "@mui/material";

import { WORKFLOW_TYPES } from "@/constants/workflow.constants";
import { useFind } from "@/hooks/crud/useFind";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { getRemainingTime } from "@/utils/date";

import { DashboardTimelineItem } from "../components/DashboardTimelineItem";
import { IconContainer } from "../components/IconContainer";
import { TitleWithActions } from "../components/TitleWithActions";

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
    <Timeline>
      <TitleWithActions title="Upcoming" />
      {scheduledWorkflows.length ? (
        <Box>
          {scheduledWorkflows
            .sort((s1, s2) =>
              (s1.runAfterMs || 0) > (s2.runAfterMs || 0) ? 1 : -1,
            )
            .map(({ id, name, type, schedule, runAfterMs, description }) => (
              <DashboardTimelineItem
                key={id}
                text={description || ""}
                time={getRemainingTime(runAfterMs)}
                onClick={() => {
                  router.push({
                    pathname: `/workflow-editor/${id}`,
                  });
                }}
                renderTitle={() => {
                  const { key: _, ...rest } = WORKFLOW_TYPES[type];

                  return (
                    <>
                      <Grid display="flex" gap={1} alignItems="center">
                        <IconContainer
                          padding="2px"
                          borderRadius="50%"
                          {...rest}
                        />
                        <Typography variant="h6">{name}</Typography>
                      </Grid>
                    </>
                  );
                }}
                secondaryText={schedule || ""}
              />
            ))}
        </Box>
      ) : (
        <Paper elevation={3} variant="spaced">
          <Typography>{t("label.no_scheduled_workflows")}</Typography>
        </Paper>
      )}
    </Timeline>
  );
};
