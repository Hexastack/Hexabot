/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, Divider } from "@mui/material";
import { ColumnChart, ResponsiveChartContainer } from "eazychart-react";

import { StyledCardHeader } from "@/app-components/card/StyledCardHeader";
import { useFindStats } from "@/hooks/entities/bot-stat-hooks";
import { useTranslate } from "@/hooks/useTranslate";
import { ColumnChartStats } from "@/types/bot-stat.types";
import { buildColumnChartConfig } from "@/utils/chart";

import { NoDataChart } from "./NoDataChart";

const PopularChart = () => {
  const { t } = useTranslate();
  const { data } = useFindStats<ColumnChartStats>("popularBlocks");

  return (
    <Card>
      <StyledCardHeader
        title={t("charts.popular_blocks")}
        description={t("charts.desc.popular_blocks")}
      />
      <Divider />
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveChartContainer>
            <ColumnChart
              {...buildColumnChartConfig({
                data,
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

PopularChart.displayName = "PopularChart";

export default PopularChart;
