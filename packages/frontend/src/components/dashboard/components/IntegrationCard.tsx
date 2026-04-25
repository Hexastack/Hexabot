/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { IntegrationHealthStatus } from "@hexabot-ai/types";
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import { theme } from "@/layout/theme";
import { formatSmartDate } from "@/utils/date";

import { getIntegrationIcon } from "../utils/transform.util";

import { IconContainer } from "./IconContainer";

interface IntegrationCardProps {
  name: string;
  status: IntegrationHealthStatus;
  checkedAt: string;
  message?: string;
}

const getStatusConfig = (status: IntegrationHealthStatus) => {
  switch (status) {
    case "healthy":
      return {
        color: theme.palette.success.main,
        chipColor: "success" as const,
      };
    case "warning":
      return {
        color: theme.palette.warning.main,
        chipColor: "warning" as const,
      };
    case "unhealthy":
      return {
        color: theme.palette.error.main,
        chipColor: "error" as const,
      };
    case "disabled":
      return {
        color: theme.palette.text.disabled,
        chipColor: "default" as const,
      };
  }
};

export const IntegrationCard = ({
  name,
  status,
  checkedAt,
  message,
}: IntegrationCardProps) => {
  const { t, i18n } = useTranslate();
  const { color, chipColor } = getStatusConfig(status);
  const checkedLabel = formatSmartDate(
    new Date(checkedAt),
    i18n.resolvedLanguage || i18n.language,
  );

  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        avatar={
          <IconContainer
            icon={getIntegrationIcon(name)}
            color={color}
            borderRadius="50%"
            size={20}
          />
        }
        title={
          <Typography variant="body2" fontWeight="bold">
            {name}
          </Typography>
        }
      />

      <CardContent sx={{ pt: 0 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="caption" color="text.secondary">
            {t("dashboard.integrations.checked", { 0: checkedLabel })}
          </Typography>
          <Chip
            label={t(`dashboard.integrations.status.${status}`)}
            size="small"
            color={chipColor}
          />
        </Stack>
        {message ? (
          <Typography variant="caption" color="text.secondary" mt={1} noWrap>
            {message}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};
