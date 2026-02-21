/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { Paper, Stack, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import type { IWorkflowVersion } from "@/types/workfow-version.types";
import { formatSmartDate, normalizeDate } from "@/utils/date";

import { useWorkflowVersionActionMeta } from "./useWorkflowVersionActionMeta";
import { WorkflowVersionMetaRow } from "./WorkflowVersionMetaRow";

type WorkflowVersionItemProps = {
  version: IWorkflowVersion;
  index: number;
  total: number;
  currentVersionId?: string | null;
  publishedVersionId?: string | null;
  isSaving: boolean;
  onRestore: (id: string, definitionYml: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: () => void;
  getUserLabel: (createdBy: string) => string;
  language: string;
};

export const WorkflowVersionItem = ({
  version,
  index,
  total,
  currentVersionId,
  publishedVersionId,
  isSaving,
  onRestore,
  onPublish,
  onUnpublish,
  getUserLabel,
  language,
}: WorkflowVersionItemProps) => {
  const { t } = useTranslate();
  const getActionMeta = useWorkflowVersionActionMeta();
  const actionMeta = getActionMeta(version.action);
  const isCurrent = currentVersionId === version.id;
  const createdAt = version.createdAt ? new Date(version.createdAt) : null;
  const timeLabel = createdAt
    ? formatSmartDate(createdAt, language)
    : t("message.no_data_to_display");
  const exactDate = createdAt ? normalizeDate(language, createdAt) : undefined;
  const createdByLabel = getUserLabel(version.createdBy);
  const message = version.message?.trim();
  const canRestore = !isCurrent && Boolean(version.definitionYml);
  const isPublished = version.id === publishedVersionId;
  const canPublish = Boolean(version.definitionYml) && !isPublished;
  const canUnpublish = isPublished;

  return (
    <TimelineItem sx={{ minHeight: "auto" }}>
      <TimelineOppositeContent
        sx={{
          flex: 0.35,
          pr: 1,
          pt: 0.7,
          minWidth: 0,
        }}
        align="right"
      >
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          title={exactDate ?? timeLabel}
        >
          {timeLabel}
        </Typography>
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot
          variant={isCurrent ? "filled" : "outlined"}
          sx={{
            borderColor: actionMeta.color,
            bgcolor: isCurrent ? actionMeta.color : "background.paper",
            color: isCurrent ? "common.white" : actionMeta.color,
            boxShadow: isCurrent ? "none" : undefined,
          }}
        />
        {index < total - 1 && <TimelineConnector sx={{ bgcolor: "divider" }} />}
      </TimelineSeparator>
      <TimelineContent sx={{ pt: 0, pb: 1, pr: 1 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 1.25,
            borderRadius: 1,
            minWidth: 0,
            "&:hover .workflow-version-actions": {
              opacity: 1,
              pointerEvents: "auto",
            },
          }}
        >
          <Stack spacing={0.5}>
            <WorkflowVersionMetaRow
              versionNumber={version.version}
              actionMeta={actionMeta}
              isCurrent={isCurrent}
              isPublished={isPublished}
              canRestore={canRestore}
              canPublish={canPublish}
              canUnpublish={canUnpublish}
              isSaving={isSaving}
              onRestore={() => {
                if (version.definitionYml) {
                  onRestore(version.id, version.definitionYml);
                }
              }}
              onPublish={() => {
                onPublish(version.id);
              }}
              onUnpublish={onUnpublish}
            />
            <Typography
              variant="body2"
              color={message ? "text.primary" : "text.secondary"}
              sx={{ wordBreak: "break-word" }}
            >
              {message || t("visual_editor.workflow_versions.message_fallback")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("visual_editor.workflow_versions.by", {
                0: createdByLabel,
              })}
            </Typography>
          </Stack>
        </Paper>
      </TimelineContent>
    </TimelineItem>
  );
};
