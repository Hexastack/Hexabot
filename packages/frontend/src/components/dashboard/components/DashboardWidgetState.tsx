/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type DashboardWidgetStateTone = "info" | "success" | "error";

const TONE_ICON = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
} satisfies Record<DashboardWidgetStateTone, LucideIcon>;
const TONE_COLOR = {
  info: "info",
  success: "success",
  error: "error",
} as const;

export const DashboardWidgetState = ({
  title,
  description,
  action,
  icon,
  tone = "info",
  loading = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  tone?: DashboardWidgetStateTone;
  loading?: boolean;
}) => {
  const theme = useTheme();
  const Icon = loading ? LoaderCircle : icon || TONE_ICON[tone];
  const paletteColor = theme.palette[TONE_COLOR[tone]].main;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: "1px dashed",
        borderColor: alpha(paletteColor, 0.28),
        bgcolor: alpha(paletteColor, 0.04),
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={1.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Box
          color={paletteColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          {loading ? (
            <CircularProgress size={22} color={TONE_COLOR[tone]} />
          ) : (
            <Icon size={22} />
          )}
        </Box>
        <Box minWidth={0} flex={1}>
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box flexShrink={0}>{action}</Box> : null}
      </Stack>
    </Paper>
  );
};
