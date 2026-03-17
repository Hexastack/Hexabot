/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, Stack, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import { IMcpServerToolsDiscovery } from "@/types/mcp-server.types";

import { ServerDetailsCard } from "./ServerDetailsCard";
import { SummaryGrid } from "./SummaryGrid";
import { SummaryItem } from "./SummaryItem";
import { ToolDetailsCard } from "./ToolDetailsCard";

type ToolsDiscoveryResultSectionProps = {
  discovery: IMcpServerToolsDiscovery;
};

export const ToolsDiscoveryResultSection = ({
  discovery,
}: ToolsDiscoveryResultSectionProps) => {
  const { t } = useTranslate();

  return (
    <Stack gap={2}>
      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <SummaryGrid>
            <SummaryItem
              label={t("label.tool_count")}
              value={String(discovery.toolCount)}
            />
            <SummaryItem
              label={t("label.name")}
              value={discovery.server.name}
            />
            <SummaryItem
              label={t("label.transport")}
              value={t(`label.${discovery.server.transport}`)}
            />
            <SummaryItem
              label={t("label.connection")}
              value={
                discovery.server
                  ? t(`label.${discovery.server}`)
                  : t("label.none")
              }
            />
          </SummaryGrid>
        </CardContent>
      </Card>

      <ServerDetailsCard server={discovery.server} />

      <Stack gap={1.5}>
        {discovery.tools.length ? (
          discovery.tools.map((tool) => (
            <ToolDetailsCard key={tool.name} tool={tool} />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("message.no_data_to_display")}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};
