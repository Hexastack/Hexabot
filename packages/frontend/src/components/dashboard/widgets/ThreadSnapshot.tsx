/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StatsType } from "@hexabot-ai/types";
import {
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  axisClasses,
  barElementClasses,
  chartsGridClasses,
  chartsTooltipClasses,
  getBarElementUtilityClass,
  legendClasses,
} from "@mui/x-charts";
import { BarChart } from "@mui/x-charts/BarChart";

import { useApiClientQuery } from "@/hooks/useApiClient";
import { useTranslate } from "@/hooks/useTranslate";
import type { TTranslationKeys } from "@/i18n/i18n.types";

import { TitleWithActions } from "../components/TitleWithActions";

const SERIES_LABEL_KEYS = {
  [StatsType.new_threads]: "dashboard.thread_snapshot.series.new_threads",
  [StatsType.handoffs]: "dashboard.thread_snapshot.series.handoffs",
} satisfies Record<
  StatsType.new_threads | StatsType.handoffs,
  TTranslationKeys
>;

export const ThreadSnapshot = () => {
  const { t } = useTranslate();
  const theme = useTheme();
  const { data, isError, isLoading } = useApiClientQuery("getThreadSnapshot", {
    refetchInterval: 60000,
  });
  const hasData =
    data?.series.some((series) => series.data.some((value) => value > 0)) ??
    false;
  const seriesColors = {
    [StatsType.new_threads]: theme.palette.primary.main,
    [StatsType.handoffs]: theme.palette.warning.main,
  } satisfies Record<StatsType.new_threads | StatsType.handoffs, string>;

  return (
    <Card>
      <CardContent>
        <TitleWithActions
          title={t("dashboard.thread_snapshot.title")}
          actions={
            <Typography variant="caption" color="text.secondary">
              {t("dashboard.thread_snapshot.range")}
            </Typography>
          }
        />
        {isLoading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            minHeight={320}
            gap={2}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              {t("dashboard.thread_snapshot.loading")}
            </Typography>
          </Stack>
        ) : isError ? (
          <Alert severity="error">{t("dashboard.thread_snapshot.error")}</Alert>
        ) : data && hasData ? (
          <BarChart
            title={t("dashboard.thread_snapshot.title")}
            desc={t("dashboard.thread_snapshot.chart_description")}
            height={320}
            series={data.series.map((series) => ({
              id: series.type,
              data: series.data,
              label: t(SERIES_LABEL_KEYS[series.type]),
              color: seriesColors[series.type],
              highlightScope: {
                highlighted: "item",
                faded: "global",
              },
            }))}
            margin={{ top: 24, right: 20, bottom: 64, left: 44 }}
            borderRadius={6}
            xAxis={[
              {
                data: data.xAxis,
                scaleType: "band",
                disableLine: true,
                disableTicks: true,
                tickLabelStyle: {
                  fill: theme.palette.text.secondary,
                  fontSize: 12,
                  fontWeight: 500,
                },
              },
            ]}
            yAxis={[
              {
                disableLine: true,
                disableTicks: true,
                tickLabelStyle: {
                  fill: theme.palette.text.secondary,
                  fontSize: 12,
                  fontWeight: 500,
                },
              },
            ]}
            grid={{ horizontal: true }}
            slotProps={{
              legend: {
                position: { vertical: "bottom", horizontal: "middle" },
                itemMarkWidth: 10,
                itemMarkHeight: 10,
                markGap: 6,
                itemGap: 18,
                padding: 0,
                labelStyle: {
                  fill: theme.palette.text.secondary,
                  fontSize: 12,
                  fontWeight: 500,
                },
              },
              popper: {
                sx: {
                  [`& .${chartsTooltipClasses.paper}`]: {
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: theme.palette.baseShadow,
                  },
                  [`& .${chartsTooltipClasses.mark}`]: {
                    borderRadius: "50%",
                  },
                },
              },
            }}
            sx={{
              mt: 1,
              [`& .${barElementClasses.root}`]: {
                transition:
                  "opacity 0.2s ease-in, fill 0.2s ease-in, filter 0.2s ease-in",
              },
              [`& .${getBarElementUtilityClass(
                `series-${StatsType.new_threads}`,
              )}`]: {
                filter: `drop-shadow(0 6px 10px ${alpha(
                  theme.palette.primary.main,
                  0.16,
                )})`,
              },
              [`& .${getBarElementUtilityClass(
                `series-${StatsType.handoffs}`,
              )}`]: {
                filter: `drop-shadow(0 6px 10px ${alpha(
                  theme.palette.warning.main,
                  0.18,
                )})`,
              },
              [`& .${axisClasses.tickLabel}`]: {
                fill: theme.palette.text.secondary,
              },
              [`& .${chartsGridClasses.line}`]: {
                stroke: alpha(theme.palette.text.primary, 0.08),
                strokeDasharray: "4 4",
              },
              [`& .${legendClasses.mark}`]: {
                rx: 5,
                ry: 5,
              },
              [`& .${legendClasses.root}`]: {
                transform: "translateY(6px)",
              },
            }}
          />
        ) : (
          <Alert severity="info">{t("dashboard.thread_snapshot.empty")}</Alert>
        )}
      </CardContent>
    </Card>
  );
};
