/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Chip, Typography, useTheme } from "@mui/material";
import { RotateCcw } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";

type WorkflowVersionMetaRowProps = {
  versionNumber: number;
  actionMeta: { label: string; color: string; background: string };
  isCurrent: boolean;
  canRestore: boolean;
  isSaving: boolean;
  onRestore: () => void;
};

export const WorkflowVersionMetaRow = ({
  versionNumber,
  actionMeta,
  isCurrent,
  canRestore,
  isSaving,
  onRestore,
}: WorkflowVersionMetaRowProps) => {
  const { t } = useTranslate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 0.5,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {t("visual_editor.workflow_versions.version", {
          0: versionNumber,
        })}
      </Typography>
      <Chip
        size="small"
        label={actionMeta.label}
        sx={{
          color: actionMeta.color,
          backgroundColor: actionMeta.background,
        }}
      />
      {isCurrent && (
        <Chip
          size="small"
          label={t("visual_editor.workflow_versions.current")}
          color="primary"
        />
      )}
      {canRestore && (
        <Box
          className="workflow-version-actions"
          sx={{
            display: "flex",
            alignItems: "center",
            ml: "auto",
            opacity: 0,
            pointerEvents: "none",
            transition: theme.transitions.create("opacity", {
              duration: theme.transitions.duration.shortest,
            }),
          }}
        >
          <Button
            size="small"
            variant="text"
            color="warning"
            disabled={isSaving}
            onClick={onRestore}
            startIcon={<RotateCcw size={14} />}
            sx={{
              minWidth: 0,
              px: 1,
              fontSize: 12,
              textTransform: "none",
            }}
          >
            {t("button.restore")}
          </Button>
        </Box>
      )}
    </Box>
  );
};
