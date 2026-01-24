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
import { Box, Typography, useTheme } from "@mui/material";

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
  isSaving: boolean;
  onRestore: (id: string, definitionYml: string) => void;
  getUserLabel: (createdBy: string) => string;
  language: string;
};

export const WorkflowVersionItem = ({
  version,
  index,
  total,
  currentVersionId,
  isSaving,
  onRestore,
  getUserLabel,
  language,
}: WorkflowVersionItemProps) => {
  const { t } = useTranslate();
  const theme = useTheme();
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
          sx={{
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
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
            bgcolor: isCurrent
              ? actionMeta.color
              : theme.palette.background.paper,
            color: isCurrent ? theme.palette.common.white : actionMeta.color,
            boxShadow: "none",
          }}
        />
        {index < total - 1 && (
          <TimelineConnector sx={{ backgroundColor: theme.palette.divider }} />
        )}
      </TimelineSeparator>
      <TimelineContent sx={{ py: 0, pb: 2, pr: 1 }}>
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            minWidth: 0,
            "&:hover .workflow-version-actions": {
              opacity: 1,
              pointerEvents: "auto",
            },
          }}
        >
          <WorkflowVersionMetaRow
            versionNumber={version.version}
            actionMeta={actionMeta}
            isCurrent={isCurrent}
            canRestore={canRestore}
            isSaving={isSaving}
            onRestore={() => {
              if (version.definitionYml) {
                onRestore(version.id, version.definitionYml);
              }
            }}
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
        </Box>
      </TimelineContent>
    </TimelineItem>
  );
};
