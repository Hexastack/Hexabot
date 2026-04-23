/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowVersionAction } from "@hexabot-ai/types";
import { useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback } from "react";

import { useTranslate } from "@/hooks/useTranslate";

export const useWorkflowVersionActionMeta = () => {
  const theme = useTheme();
  const { t } = useTranslate();

  return useCallback(
    (action?: WorkflowVersionAction | null) => {
      const fallback = {
        label: t("visual_editor.workflow_versions.actions.unknown"),
        color: theme.palette.text.secondary,
        background: alpha(theme.palette.text.secondary, 0.12),
      };

      switch (action) {
        case WorkflowVersionAction.create:
          return {
            label: t("visual_editor.workflow_versions.actions.create"),
            color: theme.palette.success.main,
            background: alpha(theme.palette.success.main, 0.12),
          };
        case WorkflowVersionAction.update:
          return {
            label: t("visual_editor.workflow_versions.actions.update"),
            color: theme.palette.info.main,
            background: alpha(theme.palette.info.main, 0.12),
          };
        case WorkflowVersionAction.restore:
          return {
            label: t("visual_editor.workflow_versions.actions.restore"),
            color: theme.palette.warning.main,
            background: alpha(theme.palette.warning.main, 0.12),
          };
        case WorkflowVersionAction.import:
          return {
            label: t("visual_editor.workflow_versions.actions.import"),
            color: theme.palette.secondary.main,
            background: alpha(theme.palette.secondary.main, 0.12),
          };
        default:
          return fallback;
      }
    },
    [t, theme],
  );
};
