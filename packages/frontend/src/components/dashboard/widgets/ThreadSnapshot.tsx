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
import { BarChart } from "@mui/x-charts/BarChart";

import { useApiClientQuery } from "@/hooks/useApiClient";
import { useTranslate } from "@/hooks/useTranslate";
import type { TTranslationKeys } from "@/i18n/i18n.types";
import { theme } from "@/layout/theme";

import { TitleWithActions } from "../components/TitleWithActions";

const SERIES_LABEL_KEYS = {
  [StatsType.new_threads]: "dashboard.thread_snapshot.series.new_threads",
  [StatsType.handoffs]: "dashboard.thread_snapshot.series.handoffs",
} satisfies Record<
  StatsType.new_threads | StatsType.handoffs,
  TTranslationKeys
>;
const SERIES_COLORS: Record<
  StatsType.new_threads | StatsType.handoffs,
  string
> = {
  [StatsType.new_threads]: theme.palette.primary.main,
  [StatsType.handoffs]: theme.palette.secondary.main,
};

export const ThreadSnapshot = () => {
  const { t } = useTranslate();
  const { data, isError, isLoading } = useApiClientQuery("getThreadSnapshot", {
    refetchInterval: 60000,
  });
  const hasData =
    data?.series.some((series) => series.data.some((value) => value > 0)) ??
    false;

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
            height={320}
            series={data.series.map((series) => ({
              data: series.data,
              label: t(SERIES_LABEL_KEYS[series.type]),
              color: SERIES_COLORS[series.type],
            }))}
            xAxis={[
              {
                data: data.xAxis,
                scaleType: "band",
                disableLine: true,
                disableTicks: true,
              },
            ]}
            yAxis={[{ disableLine: true, disableTicks: true }]}
            grid={{ horizontal: true }}
            slotProps={{
              legend: {
                position: { vertical: "bottom", horizontal: "middle" },
                itemMarkWidth: 10,
                itemMarkHeight: 10,
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
