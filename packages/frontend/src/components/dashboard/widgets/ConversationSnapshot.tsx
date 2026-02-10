/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

import { theme } from "@/layout/theme";

import { TitleWithActions } from "../components/TitleWithActions";
import { mockConversationData } from "../mockData";

export const ConversationSnapshot = () => (
  <Card>
    <TitleWithActions
      title="Conversation Snapshot"
      actions={<Typography variant="caption">Last 7 days</Typography>}
    />
    <BarChart
      height={320}
      series={mockConversationData.series.map((s) => ({
        ...s,
        color:
          s.label === "Conversations"
            ? theme.palette.primary.main
            : theme.palette.secondary.main,
      }))}
      xAxis={[
        {
          data: mockConversationData.xAxis,
          scaleType: "band",
          disableLine: true,
          disableTicks: true,
        },
      ]}
      yAxis={[{ disableLine: true, disableTicks: true }]}
      grid={{ horizontal: true }}
      slotProps={{
        legend: {
          position: { vertical: "bottom", horizontal: "middle" },
          itemMarkWidth: 10,
          itemMarkHeight: 10,
        },
      }}
    />
  </Card>
);
