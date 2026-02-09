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

export const DashboardTimelineItem = ({
  time = null,
  getTitle,
  author,
  description = "",
  onClick,
}: {
  time: string | null;
  getTitle: () => JSX.Element;
  author?: string;
  description?: string;
  onClick?: () => void;
}) => {
  const theme = useTheme();

  return (
    <TimelineItem
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
          {time}
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
            onClick?.();
          }}
        >
          {getTitle?.()}
          <Typography color="text.secondary">{description}</Typography>
          <Box m="1px 0 0 1px" display="flex" flexDirection="row" gap="9px">
            {author ? (
              <Typography
                sx={{ display: "block", alignSelf: "end" }}
                color={theme.palette.grey[600]}
                variant="caption"
              >
                {author}
              </Typography>
            ) : null}
          </Box>
        </Paper>
      </TimelineContent>
    </TimelineItem>
  );
};
