/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

import { TitleWithActions } from "../components/TitleWithActions";
import { mockConversationData } from "../mockData";

export const ConversationSnapshot = () => {
  const theme = useTheme();

  return (
    <Card>
      <TitleWithActions
        title="Conversation Snapshot"
        actions={<Typography variant="caption">Last 7 days</Typography>}
      />
      <BarChart
        series={mockConversationData.series.map((s) => ({
          ...s,
          color:
            s.label === "Conversations"
              ? theme.palette.primary.main
              : theme.palette.secondary.main,
        }))}
        height={320}
        xAxis={[
          {
            data: mockConversationData.xAxis,
            scaleType: "band",
            disableLine: true,
            disableTicks: true,
          },
        ]}
        yAxis={[{ disableLine: true, disableTicks: true }]}
        margin={{ top: 20, bottom: 40, left: 40, right: 10 }}
        slotProps={{
          legend: {
            hidden: false,
            position: { vertical: "bottom", horizontal: "middle" },
            itemMarkWidth: 10,
            itemMarkHeight: 10,
          },
        }}
        grid={{ horizontal: true }}
        sx={{
          "& .MuiChartsAxis-line": { stroke: "none" },
          "& .MuiChartsAxis-tick": { stroke: "none" },
        }}
      />
    </Card>
  );
};
