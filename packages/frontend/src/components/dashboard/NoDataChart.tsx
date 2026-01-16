/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { styled, Typography } from "@mui/material";
import { ChartLine } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

export const StyledMessage = styled(Typography)(
  SXStyleOptions({
    color: "grey.400",
    fontSize: "body1.fontSize",
    fontWeight: "700",
    display: "block",
    margin: 0,
  }),
);

export const NoDataChart = () => {
  const { t } = useTranslate();

  return (
    <StyledMessage>
      <ChartLine size={18} style={{ marginRight: 6, verticalAlign: "middle" }} />
      {t("charts.no_data")}
    </StyledMessage>
  );
};
