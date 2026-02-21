/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, Chip, Stack, Typography, useTheme } from "@mui/material";
import { CloudOff, CloudUpload, RotateCcw } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";

type WorkflowVersionMetaRowProps = {
  versionNumber: number;
  actionMeta: { label: string; color: string; background: string };
  isCurrent: boolean;
  isPublished: boolean;
  canRestore: boolean;
  canPublish: boolean;
  canUnpublish: boolean;
  isSaving: boolean;
  onRestore: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
};

export const WorkflowVersionMetaRow = ({
  versionNumber,
  actionMeta,
  isCurrent,
  isPublished,
  canRestore,
  canPublish,
  canUnpublish,
  isSaving,
  onRestore,
  onPublish,
  onUnpublish,
}: WorkflowVersionMetaRowProps) => {
  const { t } = useTranslate();
  const theme = useTheme();
  const iconSize = theme.typography.pxToRem(14);
  const hasActions = canRestore || canPublish || canUnpublish;

  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      spacing={0.5}
      useFlexGap
    >
      <Typography variant="subtitle2">
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
      {isPublished && (
        <Chip
          size="small"
          label={t("visual_editor.flows_drawer.status.published")}
          color="success"
        />
      )}
      {hasActions && (
        <Stack
          className="workflow-version-actions"
          direction="row"
          alignItems="center"
          ml="auto"
          sx={{
            opacity: 0,
            pointerEvents: "none",
            transition: theme.transitions.create("opacity", {
              duration: theme.transitions.duration.shortest,
            }),
          }}
        >
          {canPublish && (
            <Button
              size="small"
              variant="text"
              color="primary"
              disabled={isSaving}
              onClick={onPublish}
              startIcon={<CloudUpload size={iconSize} />}
              sx={{
                minWidth: 0,
                px: 1,
                fontSize: theme.typography.caption.fontSize,
                textTransform: "none",
              }}
            >
              {t("button.publish")}
            </Button>
          )}
          {canUnpublish && (
            <Button
              size="small"
              variant="text"
              color="warning"
              disabled={isSaving}
              onClick={onUnpublish}
              startIcon={<CloudOff size={iconSize} />}
              sx={{
                minWidth: 0,
                px: 1,
                fontSize: theme.typography.caption.fontSize,
                textTransform: "none",
              }}
            >
              {t("button.unpublish")}
            </Button>
          )}
          {canRestore && (
            <Button
              size="small"
              variant="text"
              color="warning"
              disabled={isSaving}
              onClick={onRestore}
              startIcon={<RotateCcw size={iconSize} />}
              sx={{
                minWidth: 0,
                px: 1,
                fontSize: theme.typography.caption.fontSize,
                textTransform: "none",
              }}
            >
              {t("button.restore")}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
};
