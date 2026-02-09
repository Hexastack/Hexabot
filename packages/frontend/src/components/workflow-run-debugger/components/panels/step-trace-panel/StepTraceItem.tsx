/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { StepExecutionRecord } from "@hexabot-ai/agentic";
import { Box, Chip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { resolveWorkflowStepTheme } from "@/components/visual-editor/v4/utils/workflow-theme.utils";
import { useWorkflowActionsCatalog } from "@/components/workflow-run-debugger/contexts/workflow-actions.context";

import { ActionStatusIndicator } from "./ActionStatusIndicator";
import { getDurationLabel } from "./utils";

type StepTraceItemProps = {
  step: StepExecutionRecord;
};

export const StepTraceItem = ({ step }: StepTraceItemProps) => {
  const theme = useTheme();
  const { actionsByName } = useWorkflowActionsCatalog();
  const actionDefinition = step.action
    ? actionsByName.get(step.action)
    : undefined;
  const resolvedTheme = resolveWorkflowStepTheme({
    action: actionDefinition,
    status: step.status,
  });
  const groupLabel = actionDefinition?.group?.trim();
  const accentColor =
    resolvedTheme.iconColor ||
    resolvedTheme.borderColor ||
    theme.palette.primary.main;
  const itemBorderColor = resolvedTheme.borderColor || "divider";
  const itemBackgroundColor =
    resolvedTheme.bgColor || theme.palette.background.paper;
  const IconComponent = resolvedTheme.Icon;

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
        borderColor: itemBorderColor,
        backgroundColor: itemBackgroundColor,
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
          backgroundColor: alpha(accentColor, 0.12),
          color: accentColor,
          flexShrink: 0,
        }}
      >
        <IconComponent size={18} />
      </Box>
      <Box minWidth={0}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {step.name}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          {groupLabel ? (
            <Chip
              label={groupLabel}
              size="small"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            />
          ) : null}
          {step.reason && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {step.reason}
            </Typography>
          )}
        </Box>
      </Box>
      <Box display="flex" alignItems="center" gap={1.5} justifySelf="end">
        <ActionStatusIndicator status={step.status} />
        <Typography variant="caption" color="text.secondary">
          {getDurationLabel(step)}
        </Typography>
      </Box>
    </Box>
  );
};
