/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";
import { Box, Paper, Typography, useTheme } from "@mui/material";

import { WorkflowBadgeWithTitle } from "@/app-components/workflow/WorkflowBadgeWithTitle";
import { useAppRouter } from "@/hooks/useAppRouter";
import { IWorkflow } from "@/types/workfow.types";
import { getRemainingTime } from "@/utils/date";

export const UpcomingScheduleTimelineItem = ({
  scheduledWorkflow,
}: {
  scheduledWorkflow: IWorkflow;
}) => {
  const theme = useTheme();
  const router = useAppRouter();

  return (
    <TimelineItem
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

      <TimelineContent>
        <Typography variant="caption" fontWeight="bold" color="primary.main">
          {scheduledWorkflow.runAfterMs
            ? getRemainingTime(scheduledWorkflow.runAfterMs)
            : null}
        </Typography>
        <Paper
          sx={{
            p: 2,
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
            <WorkflowBadgeWithTitle
              key={scheduledWorkflow.id}
              workflow={scheduledWorkflow}
            />
          </Typography>
          <Typography color="text.secondary">
            {scheduledWorkflow.description}
          </Typography>
          <Box m="1px 0 0 1px" display="flex" flexDirection="row" gap="9px">
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
};
