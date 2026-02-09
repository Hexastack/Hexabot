/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid } from "@mui/material";
import { Activity, Layers, MessageSquare, TrendingUp } from "lucide-react";

import { useStatsSummary } from "@/hooks/entities/bot-stat-hooks";
import { useTranslate } from "@/hooks/useTranslate";

import { KPICard } from "../components/KPICard";

export const KPICards = () => {
  const { t } = useTranslate();
  const { data: summary } = useStatsSummary();
  const loadingLabel = t("dashboard.kpi.loading");
  const last24hLabel = t("dashboard.kpi.last_24h");
  const formatNumber = (value?: number) =>
    typeof value === "number" ? value.toLocaleString() : loadingLabel;
  const formatPercentage = (value?: number) =>
    typeof value === "number" ? `${value.toFixed(1)}%` : loadingLabel;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: "grow" }}>
        <KPICard
          title={t("dashboard.kpi.total_workflows")}
          value={formatNumber(summary?.totalWorkflows)}
          icon={Layers}
          color="primary"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: "grow" }}>
        <KPICard
          title={t("dashboard.kpi.total_runs")}
          value={formatNumber(summary?.totalRunsLast24h)}
          icon={Activity}
          color="info"
          subtext={last24hLabel}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: "grow" }}>
        <KPICard
          title={t("dashboard.kpi.success_rate")}
          value={formatPercentage(summary?.successRateLast24h)}
          icon={TrendingUp}
          color="success"
          subtext={last24hLabel}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: "grow" }}>
        <KPICard
          title={t("dashboard.kpi.messages")}
          value={formatNumber(summary?.totalMessagesLast24h)}
          icon={MessageSquare}
          color="secondary"
          subtext={last24hLabel}
        />
      </Grid>
    </Grid>
  );
};
