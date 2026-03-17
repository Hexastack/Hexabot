/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, Stack, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import { IMcpToolSummary } from "@/types/mcp-server.types";

import { SummaryItem } from "./SummaryItem";

type ToolDetailsCardProps = {
  tool: IMcpToolSummary;
};

export const ToolDetailsCard = ({ tool }: ToolDetailsCardProps) => {
  const { t } = useTranslate();

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack gap={1.25}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{tool.name}</Typography>
            <SummaryItem
              label={t("label.title")}
              value={tool.title || t("label.none")}
              size={12}
            />
            <SummaryItem
              label={t("label.description")}
              value={
                <Typography
                  variant="body2"
                  color={tool.description ? "text.primary" : "text.secondary"}
                >
                  {tool.description || t("label.none")}
                </Typography>
              }
              size={12}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
