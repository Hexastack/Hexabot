/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Card, CardContent, Divider } from "@mui/material";
import { MultiLineChart, ResponsiveChartContainer } from "eazychart-react";

import { StyledCardHeader } from "@/app-components/card/StyledCardHeader";
import { useFindStats } from "@/hooks/entities/bot-stat-hooks";
import { useTranslate } from "@/hooks/useTranslate";
import { LineChartStats } from "@/types/bot-stat.types";
import { buildMultiLineChartConfig, transformToLine } from "@/utils/chart";

import { NoDataChart } from "./NoDataChart";

const MessageChart = () => {
  const { t, i18n } = useTranslate();
  const { data: stats } = useFindStats<LineChartStats>("messages");
  const { data, domainKeys: domains } = transformToLine(stats);

  return (
    <Card>
      <StyledCardHeader
        title={t("label.messages")}
        description={t("charts.desc.messages")}
      />
      <Divider />
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveChartContainer>
            <MultiLineChart
              {...buildMultiLineChartConfig(i18n.language)({
                data,
                domainKeys: domains,
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

MessageChart.displayName = "MessageChart";

export default MessageChart;
