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
  createdByLabel: string;
  message?: string | null;
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
  createdByLabel,
  message,
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
  const trimmedMessage = message?.trim();

  return (
    <Stack spacing={0.5} minWidth={0}>
      <Stack
        direction="row"
        spacing={1}
        justifyContent="space-between"
        minWidth={0}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t("visual_editor.workflow_versions.version", {
            0: versionNumber,
          })}
        </Typography>
        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={0.5}
          useFlexGap
          justifyContent="flex-end"
        >
          <Chip
            size="small"
            label={actionMeta.label}
            sx={{
              color: actionMeta.color,
              backgroundColor: actionMeta.background,
              borderColor: actionMeta.color,
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
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        {t("visual_editor.workflow_versions.by", {
          0: createdByLabel,
        })}
      </Typography>

      <Typography
        variant="body2"
        color={trimmedMessage ? "text.primary" : "text.secondary"}
        sx={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
      >
        {trimmedMessage ||
          t("visual_editor.workflow_versions.message_fallback")}
      </Typography>

      {hasActions && (
        <Stack
          className="workflow-version-actions"
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          useFlexGap
          spacing={0.5}
          sx={{
            mt: 0,
            pt: 0,
            opacity: 0,
            maxHeight: 0,
            overflow: "hidden",
            borderTop: "1px solid transparent",
            pointerEvents: "none",
            transition: theme.transitions.create(
              [
                "opacity",
                "max-height",
                "margin-top",
                "padding-top",
                "border-color",
              ],
              {
                duration: theme.transitions.duration.shortest,
              },
            ),
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
            >
              {t("button.restore")}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
};
