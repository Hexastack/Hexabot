/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardHeader, Chip, Stack, Typography } from "@mui/material";

import { theme } from "@/layout/theme";

import { getIntegrationIcon } from "../utils/transform.util";

import { IconContainer } from "./IconContainer";

interface IntegrationCardProps {
  name: string;
  status: string;
  lastSync: string;
}
export const IntegrationCard = ({
  name,
  status,
  lastSync,
}: IntegrationCardProps) => {
  const isConn = status === "Connected";
  const color = isConn
    ? theme.palette.success.main
    : theme.palette.warning.main;

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

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary" mt={2}>
          Last sync: {lastSync}
        </Typography>
        <Chip
          label={status}
          size="small"
          color={isConn ? "success" : "warning"}
        />
      </Stack>
    </Card>
  );
};
