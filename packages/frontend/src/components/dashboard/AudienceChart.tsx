/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, Divider } from "@mui/material";
import { MultiLineChart, ResponsiveChartContainer } from "eazychart-react";

import { StyledCardHeader } from "@/app-components/card/StyledCardHeader";
import { useFindStats } from "@/hooks/entities/bot-stat-hooks";
import { useTranslate } from "@/hooks/useTranslate";
import { LineChartStats } from "@/types/bot-stat.types";
import { buildMultiLineChartConfig, transformToLine } from "@/utils/chart";

import { NoDataChart } from "./NoDataChart";

const AudienceChart = () => {
  const { t, i18n } = useTranslate();
  const { data: stats } = useFindStats<LineChartStats>("audiance");
  const { data, domainKeys } = transformToLine(stats);

  return (
    <Card>
      <StyledCardHeader
        title={t("charts.audience")}
        description={t("charts.desc.audience")}
      />
      <Divider />
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveChartContainer>
            <MultiLineChart
              {...buildMultiLineChartConfig(i18n.language)({
                data,
                domainKeys,
              })}
            />
          </ResponsiveChartContainer>
        ) : (
          <NoDataChart />
        )}
      </CardContent>
    </Card>
  );
};

AudienceChart.displayName = "AudienceChart";

export default AudienceChart;
