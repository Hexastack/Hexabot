/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid, { type Grid2Props as GridProps } from "@mui/material/Grid2";
import { Home } from "lucide-react";
import { PropsWithChildren } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";

import AudienceChart from "./AudienceChart";
import MessageChart from "./MessageChart";

const DashboardContent = (props: PropsWithChildren<GridProps>) => (
  <Grid size={{ md: 12, lg: 6 }} {...props} />
);

export const Dashboard = () => {
  const { t } = useTranslate();

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={Home} title={t("title.dashboard")} />
      <Grid container spacing={3}>
        <DashboardContent container gap={2}>
          <MessageChart />
        </DashboardContent>
        <DashboardContent container gap={2}>
          <AudienceChart />
        </DashboardContent>
      </Grid>
    </Grid>
  );
};
