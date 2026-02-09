/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Card, Chip, Stack, Typography, useTheme } from "@mui/material";
import { Link2, LucideIcon, Mail, MessageCircle } from "lucide-react";

import { IconContainer } from "./IconContainer";

export const IntegrationCard = ({ integration }: { integration: any }) => {
  const theme = useTheme();
  const isConn = integration.status === "Connected";
  // Mock logo or icon based on name
  const getIcon = (): LucideIcon => {
    if (integration.name.includes("WhatsApp")) return MessageCircle;
    if (integration.name.includes("Email")) return Mail;

    return Link2;
  };
  const icon = getIcon();

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconContainer
              icon={icon}
              color={
                isConn ? theme.palette.success.main : theme.palette.warning.main
              }
              borderRadius="50%"
              size={20}
            />
            <Typography variant="body2" fontWeight="bold">
              {integration.name}
            </Typography>
          </Box>
        </Stack>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="caption" color="text.secondary">
            Last sync: {integration.lastSync}
          </Typography>
          <Chip
            label={integration.status}
            size="small"
            color={isConn ? "success" : "warning"}
          />
        </Stack>
      </Stack>
    </Card>
  );
};
