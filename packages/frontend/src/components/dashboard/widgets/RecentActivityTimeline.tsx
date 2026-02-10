/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Timeline } from "@mui/lab";
import { Box, Button, Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Filter } from "lucide-react";

import { DashboardTimelineItem } from "../components/DashboardTimelineItem";
import { IconContainer } from "../components/IconContainer";
import { TitleWithActions } from "../components/TitleWithActions";
import { mockRecentActivity } from "../mockData";
import { getActivityIcon } from "../utils/transform.util";

export const RecentActivityTimeline = () => {
  const theme = useTheme();

  return (
    <Timeline>
      <TitleWithActions
        title="Activity"
        actions={
          <Button size="small" variant="text" startIcon={<Filter size={14} />}>
            Filter
          </Button>
        }
      />
      <Box>
        {mockRecentActivity.map((event) => {
          const IconType = getActivityIcon(event.text);

          return (
            <DashboardTimelineItem
              key={event.id}
              time={event.time}
              renderTitle={() => (
                <Grid display="flex" gap={1} alignItems="center">
                  <IconContainer
                    icon={IconType}
                    color={theme.palette.primary.main}
                    borderRadius="16px"
                    size={14}
                  />
                  <Typography variant="caption">
                    <Box
                      component="span"
                      fontWeight="bold"
                      color="text.primary"
                    >
                      {event.user}
                    </Box>{" "}
                    {event.text.replace(event.user, "").trim()}
                  </Typography>
                </Grid>
              )}
            />
          );
        })}
      </Box>
    </Timeline>
  );
};
