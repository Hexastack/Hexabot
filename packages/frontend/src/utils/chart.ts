/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ColumnChartProps, MultiLineChartProps } from "eazychart-react";

import { Legend } from "@/app-components/chart/Legend";
import { Tooltip } from "@/app-components/chart/Tootip";
import { IBotStat, LineChartStats } from "@/types/bot-stat.types";

const buildFormatDateTicks = (lang: string) => (dateNumber: number) =>
  `${new Date(dateNumber).toLocaleDateString(lang, {
    month: "short",
    weekday: "short",
    day: "numeric",
  })}`;
const COMMON_CHART_PROPS = {
  padding: {
    top: 25,
    left: 100,
    right: 50,
    bottom: 100,
  },
  animationOptions: {
    delay: 0,
    duration: 400,
    easing: "easeBack",
  },
  scopedSlots: {
    TooltipComponent: Tooltip,
    LegendComponent: Legend,
  },
};

export const buildMultiLineChartConfig =
  (lang: string) =>
  ({
    data,
    domainKeys,
    ...rest
  }: MultiLineChartProps): MultiLineChartProps => ({
    ...COMMON_CHART_PROPS,
    colors: ["#1AA089", "#Ab1151", "#E6A23c"],
    marker: {
      hidden: false,
      radius: 5,
      color: "#FFF",
    },
    data,
    xAxis: {
      domainKey: "day",
      nice: 0.2,
      tickFormat: buildFormatDateTicks(lang),
    },
    yAxis: {
      domainKeys,
      nice: 1,
      title: "",
    },
    ...rest,
  });

export const buildColumnChartConfig = ({
  data,
  ...rest
}: ColumnChartProps): ColumnChartProps => ({
  ...COMMON_CHART_PROPS,
  colors: ["#1AA089", "#ab1151", "#e6a23c", "#57006f", "#108aa8"],
  data,
  xAxis: {
    domainKey: "id",
    nice: 0.5,
  },
  yAxis: {
    domainKey: "value",
    nice: 2,
    title: "",
  },
  ...rest,
});

export const transformToLine = (data: LineChartStats[] | undefined) => {
  if (!data) {
    return {
      data: [],
      domainKeys: [],
    };
  }

  const values = data.reduce((acc, curr) => {
    return acc.concat(curr.values);
  }, [] as IBotStat[]);
  const domain = new Set<string>();
  const dict = values.reduce((acc, curr) => {
    domain.add(curr.name);

    acc[curr.day] = {
      ...(acc[curr.day] || { day: +new Date(curr.day) }),
      [curr.name]: curr.value,
    };

    return acc;
  }, {} as Record<string, any>);

  Object.values(dict).forEach((dayObj) => {
    domain.forEach((key) => {
      if (!(key in dayObj)) {
        dayObj[key] = null;
      }
    });
  });

  return {
    data: Object.values(dict).sort((a, b) => a.day - b.day),
    domainKeys: Array.from(domain),
  };
};
