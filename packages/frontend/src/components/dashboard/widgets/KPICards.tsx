/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid } from "@mui/material";
import { Activity, Layers, MessageSquare, TrendingUp } from "lucide-react";

import { useApiClientQuery } from "@/hooks/useApiClient";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";

import { KPICard } from "../components/KPICard";
import type { DashboardKpiId } from "../types";
import {
  formatDashboardNumber,
  formatDashboardSuccessRate,
  getVisibleDashboardKpis,
} from "../utils/permissions.util";

export const KPICards = () => {
  const { t } = useTranslate();
  const hasPermission = useHasPermission();
  const visibleKpis = getVisibleDashboardKpis(hasPermission);
  const { data: summary } = useApiClientQuery("getStatsSummary", {
    enabled: visibleKpis.length > 0,
  });
  const loadingLabel = t("dashboard.kpi.loading");
  const last24hLabel = t("dashboard.kpi.last_24h");
  const cards = [
    {
      id: "totalWorkflows",
      title: t("dashboard.kpi.total_workflows"),
      value: formatDashboardNumber(summary?.totalWorkflows, loadingLabel),
      icon: Layers,
      color: "primary",
    },
    {
      id: "totalRuns",
      title: t("dashboard.kpi.total_runs"),
      value: formatDashboardNumber(summary?.totalRunsLast24h, loadingLabel),
      icon: Activity,
      color: "info",
      subtext: last24hLabel,
    },
    {
      id: "successRate",
      title: t("dashboard.kpi.success_rate"),
      value: formatDashboardSuccessRate(
        summary?.successRateLast24h,
        loadingLabel,
      ),
      icon: TrendingUp,
      color: "success",
      subtext: last24hLabel,
    },
    {
      id: "messages",
      title: t("dashboard.kpi.messages"),
      value: formatDashboardNumber(summary?.totalMessagesLast24h, loadingLabel),
      icon: MessageSquare,
      color: "secondary",
      subtext: last24hLabel,
    },
  ].filter(({ id }) => visibleKpis.includes(id as DashboardKpiId));

  if (!cards.length) {
    return null;
  }

  return (
    <Grid container spacing={2}>
      {cards.map(({ id, ...card }) => (
        <Grid size={{ xs: 12, sm: 6, md: "grow" }} key={id}>
          <KPICard {...card} />
        </Grid>
      ))}
    </Grid>
  );
};
