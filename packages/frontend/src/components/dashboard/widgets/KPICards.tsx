/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Card, CardContent, Grid2 as Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Activity, Layers, MessageSquare, TrendingUp, Wallet } from "lucide-react";

import { mockStats } from "../mockData";

const KPICard = ({ title, value, subtext, icon: Icon, color = 'primary' }: any) => {
    const theme = useTheme();
    // Helper to get color values
    const getColor = (c: string) => {
       const colors: Record<string, string> = {
         primary: theme.palette.primary.main,
         secondary: theme.palette.secondary.main,
         success: theme.palette.success.main,
         warning: theme.palette.warning.main,
         info: theme.palette.info.main,
         error: theme.palette.error.main,
       }
       
return colors[c] || theme.palette.primary.main;
    }
    const mainColor = getColor(color);

    return (
        <Card sx={{ 
            height: "100%", 
            borderRadius: 3, 
            boxShadow: '0px 2px 10px rgba(0,0,0,0.03)',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(mainColor, 0.05)} 100%)`,
            border: `1px solid ${alpha(mainColor, 0.1)}`,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 20px ${alpha(mainColor, 0.1)}`
            }
        }}>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 }, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <Box>
                <Stack direction="row" justifyContent="center" alignItems="center" mb={2}>
                    <Box sx={{
                        p: 1.25,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha(mainColor, 0.1)} 0%, ${alpha(mainColor, 0.2)} 100%)`,
                        color: mainColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {Icon && <Icon size={22} />}
                    </Box>
                </Stack>
                
                <Typography variant="h4" component="div" fontWeight="800" sx={{ mb: 0.5, letterSpacing: '-0.5px' }}>
                    {value}
                </Typography>
            </Box>
            
            <Stack direction="row" alignItems="center" spacing={1}>
                 <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    {title}
                </Typography>
                 {subtext && (
                    <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {subtext}
                    </Typography>
                )}
            </Stack>
            </CardContent>
        </Card>
    );
}

export const KPICards = () => {
  const { workflows, runs, messages, cost } = mockStats;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
        <KPICard
          title="Total Workflows"
          value={workflows.total}
          icon={Layers}
          color="primary"
          subtext={`${workflows.conversational} Conv.`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
        <KPICard
          title="Total Runs (24h)"
          value={runs.total}
          icon={Activity}
          color="info"
          subtext={`+${runs.trend}%`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
        <KPICard
          title="Success Rate"
          value={`${runs.successRate}%`}
          icon={TrendingUp}
          color="success"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
        <KPICard
          title="Messages"
          value={messages.total.toLocaleString()}
          icon={MessageSquare}
          color="secondary"
          subtext="Last 24h"
        />
      </Grid>
       <Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
        <KPICard
          title="Est. Cost"
          value={`${cost.currency}${cost.amount}`}
          icon={Wallet}
          color="warning"
          subtext="Last 24h"
        />
      </Grid>
    </Grid>
  );
};
