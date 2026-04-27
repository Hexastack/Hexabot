/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowType } from "@hexabot-ai/types";
import { Timeline } from "@mui/lab";
import { Box, Button, Grid, Typography } from "@mui/material";

import { WORKFLOW_TYPES } from "@/constants/workflow.constants";
import { useFind } from "@/hooks/crud/useFind";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useCronFormatter } from "@/hooks/useCronFormatter";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, RouterType } from "@/services/types";
import { getRemainingTime } from "@/utils/date";

import { DashboardTimelineItem } from "../components/DashboardTimelineItem";
import { DashboardWidgetState } from "../components/DashboardWidgetState";
import { IconContainer } from "../components/IconContainer";
import { TitleWithActions } from "../components/TitleWithActions";

export const UpcomingScheduleTimeline = () => {
  const { t, i18n } = useTranslate();
  const formatCron = useCronFormatter();
  const router = useAppRouter();
  const {
    data: scheduledWorkflows,
    isError,
    isLoading,
  } = useFind(
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
      <TitleWithActions
        title={t("dashboard.upcoming_schedules")}
        actions={
          <Button
            size="small"
            variant="text"
            onClick={() =>
              router.push({ pathname: `/${RouterType.WORKFLOW_EDITOR}` })
            }
          >
            {t("button.view_all")}
          </Button>
        }
      />
      {isLoading ? (
        <DashboardWidgetState
          loading
          title={t("dashboard.schedules_state.loading_title")}
          description={t("dashboard.schedules_state.loading_description")}
        />
      ) : isError ? (
        <DashboardWidgetState
          tone="error"
          title={t("dashboard.schedules_state.error_title")}
          description={t("dashboard.schedules_state.error_description")}
        />
      ) : scheduledWorkflows.length ? (
        <Box>
          {scheduledWorkflows
            .sort((s1, s2) =>
              (s1.runAfterMs || 0) > (s2.runAfterMs || 0) ? 1 : -1,
            )
            .map(({ id, name, type, schedule, runAfterMs, description }) => (
              <DashboardTimelineItem
                key={id}
                text={description || ""}
                time={getRemainingTime(runAfterMs, i18n.language)}
                onClick={() => {
                  router.push({
                    pathname: `/${RouterType.WORKFLOW_EDITOR}/${id}`,
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
                secondaryText={schedule ? formatCron(schedule) : ""}
              />
            ))}
        </Box>
      ) : (
        <DashboardWidgetState
          title={t("label.no_scheduled_workflows")}
          description={t("dashboard.schedules_state.empty_description")}
          action={
            <Button
              size="small"
              variant="outlined"
              onClick={() => router.push(`/${RouterType.WORKFLOW_EDITOR}`)}
            >
              {t("button.view_all")}
            </Button>
          }
        />
      )}
    </Timeline>
  );
};
