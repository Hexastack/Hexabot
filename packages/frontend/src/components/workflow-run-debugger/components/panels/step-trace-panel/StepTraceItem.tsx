/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import {
  getActionTypeBadges,
  getActionTypeMeta,
  getDurationLabel,
  getStatusIndicator,
  type ActionSnapshot,
  type StatusLabels,
  type TypeLabels,
} from "./utils";

type StepTraceItemProps = {
  action: ActionSnapshot;
  statusLabels: StatusLabels;
  typeLabels: TypeLabels;
};

export const StepTraceItem = ({
  action,
  statusLabels,
  typeLabels,
}: StepTraceItemProps) => {
  const theme = useTheme();
  const { Icon, label } = getActionTypeMeta(action, typeLabels);
  const status = getStatusIndicator(action.status, statusLabels);
  const badges = getActionTypeBadges(action, {
    llm: typeLabels.llm,
    http: typeLabels.http,
    retry: typeLabels.retry,
  });

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 1.5,
        alignItems: "center",
        p: 1.5,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          color: theme.palette.primary.main,
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </Box>
      <Box minWidth={0}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {action.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {label}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          {badges.map((badge) => (
            <Chip
              key={`${action.id}-${badge}`}
              label={badge}
              size="small"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            />
          ))}
          {action.reason && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {action.reason}
            </Typography>
          )}
        </Box>
      </Box>
      <Box display="flex" alignItems="center" gap={1.5} justifySelf="end">
        <Tooltip title={status.label}>
          <Typography
            component="span"
            sx={{ color: status.color, fontWeight: 600 }}
          >
            {status.symbol}
          </Typography>
        </Tooltip>
        <Typography variant="caption" color="text.secondary">
          {getDurationLabel(action)}
        </Typography>
      </Box>
    </Box>
  );
};
