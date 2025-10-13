/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Home from "@mui/icons-material/Home";
import { Grid, GridProps } from "@mui/material";
import { PropsWithChildren } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";

import AudienceChart from "./AudienceChart";
import ConversationChart from "./ConversationChart";
import MessageChart from "./MessageChart";
import PopularChart from "./PopularChart";

const DashboardContent = (props: PropsWithChildren<GridProps>) => (
  <Grid item md={12} lg={6} {...props} />
);

export const Dashboard = () => {
  const { t } = useTranslate();

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={Home} title={t("title.dashboard")} />
      <Grid container spacing={3}>
        <DashboardContent item container gap={2}>
          <MessageChart />
        </DashboardContent>
        <DashboardContent item container gap={2}>
          <ConversationChart />
        </DashboardContent>
        <DashboardContent item container gap={2}>
          <AudienceChart />
        </DashboardContent>
        <DashboardContent item container gap={2}>
          <PopularChart />
        </DashboardContent>
      </Grid>
    </Grid>
  );
};
