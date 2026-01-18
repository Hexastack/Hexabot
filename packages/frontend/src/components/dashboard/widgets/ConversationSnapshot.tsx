/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, CardHeader, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

import { mockConversationData } from "../mockData";

export const ConversationSnapshot = () => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: "100%", borderRadius: 3, boxShadow: '0px 2px 10px rgba(0,0,0,0.03)' }}>
      <CardHeader 
        title="Conversation Snapshot" 
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        action={
            <Typography variant="caption" sx={{ bgcolor: theme.palette.action.selected, px: 1, py: 0.5, borderRadius: 1 }}>
                Last 7 days
            </Typography>
        }
      />
      <CardContent sx={{ height: 350, width: '100%', pt: 0 }}>
         <BarChart
            series={mockConversationData.series.map(s => ({ ...s, color: s.label === 'Conversations' ? theme.palette.primary.main : theme.palette.secondary.main }))}
            height={320}
            xAxis={[{ data: mockConversationData.xAxis, scaleType: 'band', disableLine: true, disableTicks: true }]}
            yAxis={[{ disableLine: true, disableTicks: true }]}
            margin={{ top: 20, bottom: 40, left: 40, right: 10 }}
            slotProps={{
                legend: {
                    hidden: false,
                    position: { vertical: 'bottom', horizontal: 'middle' },
                    itemMarkWidth: 10,
                    itemMarkHeight: 10,
                }
            }}
            grid={{ horizontal: true }}
            sx={{
                '& .MuiChartsAxis-line': { stroke: 'none' },
                '& .MuiChartsAxis-tick': { stroke: 'none' }
            }}
        />
      </CardContent>
    </Card>
  );
};
