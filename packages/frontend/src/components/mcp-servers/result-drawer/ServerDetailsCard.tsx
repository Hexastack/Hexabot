/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, Stack, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import { IMcpServerInfo } from "@/types/mcp-server.types";

import { SummaryGrid } from "./SummaryGrid";
import { SummaryItem } from "./SummaryItem";
import { getConnectionLabel } from "./utils";

type ServerDetailsCardProps = {
  server: IMcpServerInfo;
};

export const ServerDetailsCard = ({ server }: ServerDetailsCardProps) => {
  const { t } = useTranslate();

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">
            {t("label.server_details")}
          </Typography>
          <SummaryGrid>
            <SummaryItem label={t("label.name")} value={server.name} />
            <SummaryItem
              label={t("label.transport")}
              value={t(`label.${server.transport}`)}
            />
            <SummaryItem
              label={t("label.connection")}
              value={getConnectionLabel(server, t("label.none"))}
            />
            <SummaryItem
              label={t("label.cwd")}
              value={server.cwd || t("label.none")}
            />
          </SummaryGrid>
        </Stack>
      </CardContent>
    </Card>
  );
};
