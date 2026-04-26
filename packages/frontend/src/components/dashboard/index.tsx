/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid from "@mui/material/Grid";
import { Home } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";

import { AttentionRequired } from "./widgets/AttentionRequired";
import { IntegrationsHealth } from "./widgets/IntegrationsHealth";
import { KPICards } from "./widgets/KPICards";
import { LatestWorkflows } from "./widgets/LatestWorkflows";
import { QuickActions } from "./widgets/QuickActions";
import { RecentActivityTimeline } from "./widgets/RecentActivityTimeline";
import { RecentRuns } from "./widgets/RecentRuns";
import { ThreadSnapshot } from "./widgets/ThreadSnapshot";
import { UpcomingScheduleTimeline } from "./widgets/UpcomingScheduleTimeline";

export const Dashboard = () => {
  const { t } = useTranslate();

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={Home} title={t("title.dashboard")} />
      <Grid size={12}>
        <KPICards />
      </Grid>
      {/* 2. Main Dashboard Layout */}
      <Grid size={12} container spacing={3}>
        {/* Left Column: Activity & Actions */}
        <Grid
          size={{ md: 8, xs: 12 }}
          container
          spacing={3}
          flexDirection="column"
        >
          {/* Quick Actions Bar */}
          <Grid size={12}>
            <QuickActions />
          </Grid>
          <Grid size={12}>
            {/* TODO replace mock data by an API integration */}
            <LatestWorkflows />
          </Grid>
          <Grid size={12}>
            <RecentRuns />
          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ md: 6, xs: 12 }}>
              <ThreadSnapshot />
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <RecentActivityTimeline />
            </Grid>
          </Grid>
        </Grid>
        {/* Right Column: Status & Schedule */}
        <Grid
          size={{ md: 4, xs: 12 }}
          container
          spacing={3}
          flexDirection="column"
        >
          <Grid size={12}>
            <AttentionRequired />
          </Grid>
          <Grid size={12}>
            <UpcomingScheduleTimeline />
          </Grid>
          <Grid size={12}>
            <IntegrationsHealth />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
