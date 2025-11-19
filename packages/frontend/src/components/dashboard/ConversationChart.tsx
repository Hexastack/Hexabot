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

const ConversationChart = () => {
  const { t, i18n } = useTranslate();
  const { data: conversations } = useFindStats<LineChartStats>("conversation");
  const { data: conversationData, domainKeys: conversationDomains } =
    transformToLine(conversations);

  return (
    <Card>
      <StyledCardHeader
        title={t("charts.conversations")}
        description={t("charts.desc.conversations")}
      />
      <Divider />
      <CardContent>
        {conversationData.length > 0 ? (
          <ResponsiveChartContainer>
            <MultiLineChart
              {...buildMultiLineChartConfig(i18n.language)({
                data: conversationData,
                domainKeys: conversationDomains,
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

ConversationChart.displayName = "ConversationChart";

export default ConversationChart;
