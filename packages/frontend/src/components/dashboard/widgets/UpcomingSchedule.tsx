/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";
import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { BadgeWithTitle } from "@/app-components/displays/Badge";
import { BASE_TYPES } from "@/components/visual-editor/v4/components/main/FlowsDrawer/constants";
import { useFind } from "@/hooks/crud/useFind";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { WorkflowType } from "@/types/workfow.types";
import { getRemainingTime } from "@/utils/date";

export const UpcomingSchedule = () => {
  const theme = useTheme();
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
    <Box sx={{ height: "100%" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        px={1}
      >
        <Typography variant="h6" fontWeight="bold">
          Upcoming
        </Typography>
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
            .map((scheduledWorkflow) => {
              return (
                <TimelineItem
                  key={scheduledWorkflow.id}
                  title={scheduledWorkflow.name}
                  sx={{
                    "&:before": {
                      display: "none",
                    },
                  }}
                >
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    <TimelineConnector />
                  </TimelineSeparator>

                  <TimelineContent
                    sx={{
                      py: "10px 12px",
                      px: 3,
                      pr: 0,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color="primary.main"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mb: 0.5,
                        textTransform: "capitalize",
                      }}
                    >
                      {scheduledWorkflow.runAfterMs
                        ? getRemainingTime(scheduledWorkflow.runAfterMs)
                        : null}
                    </Typography>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        bgcolor: "background.paper",
                        border: "1px solid transparent",
                        transition: ".2s",
                        "&:hover": {
                          borderColor: "primary.main",
                          cursor: "pointer",
                          marginLeft: "2px",
                        },
                      }}
                      onClick={() => {
                        router.push({
                          pathname: `/workflow-editor/${scheduledWorkflow.id}`,
                        });
                      }}
                    >
                      <Typography variant="h6" component="span">
                        <BadgeWithTitle
                          {...BASE_TYPES[scheduledWorkflow.type]}
                          key={scheduledWorkflow.id}
                          title={scheduledWorkflow.name}
                        />
                      </Typography>
                      <Typography color="text.secondary">
                        {scheduledWorkflow.description}
                      </Typography>
                      <Box
                        m="1px 0 0 1px"
                        display="flex"
                        flexDirection="row"
                        gap="9px"
                      >
                        <Typography
                          sx={{ display: "block", alignSelf: "end" }}
                          color={theme.palette.grey[600]}
                          variant="caption"
                        >
                          {scheduledWorkflow.schedule}
                        </Typography>
                      </Box>
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
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
