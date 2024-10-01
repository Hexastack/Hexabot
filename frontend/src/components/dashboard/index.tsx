/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
