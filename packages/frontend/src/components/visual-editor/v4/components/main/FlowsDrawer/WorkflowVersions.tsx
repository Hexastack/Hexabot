/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import {
  Box,
  Chip,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
// eslint-disable-next-line no-duplicate-imports
import { WorkflowVersionAction } from "@/types/workfow-version.types";
import { formatSmartDate, normalizeDate } from "@/utils/date";

import { useWorkflow } from "../../../hooks/useWorkflow";

export const WorkflowVersions = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslate();
  const { workflow } = useWorkflow();
  const getUserFromCache = useGetFromCache(EntityType.USER);
  const {
    data: versions = [],
    isLoading,
    isFetching,
  } = useFind(
    {
      entity: EntityType.WORKFLOW_VERSION,
      format: Format.FULL,
    },
    {
      hasCount: false,
    },
    {
      enabled: !!workflow,
      routeParams: workflow ? { id: workflow.id } : undefined,
    },
  );
  const currentVersionId = workflow?.currentVersion;
  const isBusy = isLoading || isFetching;
  const getActionMeta = (action?: WorkflowVersionAction | null) => {
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
      case WorkflowVersionAction.publish:
        return {
          label: t("visual_editor.workflow_versions.actions.publish"),
          color: theme.palette.primary.main,
          background: alpha(theme.palette.primary.main, 0.12),
        };
      default:
        return fallback;
    }
  };
  const getUserByVersion = (createdBy: string) => {
    const user = getUserFromCache(createdBy);

    if (!user) {
      return createdBy + t("visual_editor.workflow_versions.system");
    }

    const email = typeof user.email === "string" ? user.email : "";
    const fullName = `${user.firstName} ${user.lastName}`.trim();

    return (
      fullName || email || t("visual_editor.workflow_versions.unknown_user")
    );
  };
  const renderState = (message: string, loading = false) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 3,
        height: "100%",
        textAlign: "center",
      }}
    >
      {loading && (
        <CircularProgress
          size={20}
          thickness={5}
          sx={{ mb: 1 }}
          aria-label={t("message.loading")}
        />
      )}
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" flex={1} minHeight={0}>
      <Box px={2} pt={2} pb={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          {t("visual_editor.workflow_versions.title")}
        </Typography>
      </Box>
      <Box flex={1} minHeight={0} overflow="auto" px={1} pb={2}>
        {!workflow ? (
          renderState(t("visual_editor.workflow_versions.empty_selection"))
        ) : isBusy ? (
          renderState(t("message.loading"), true)
        ) : versions.length === 0 ? (
          renderState(t("visual_editor.workflow_versions.empty"))
        ) : (
          <Timeline sx={{ m: 0, p: 0 }}>
            {versions.map((version, index) => {
              const actionMeta = getActionMeta(version.action);
              const isCurrent = currentVersionId === version.id;
              const createdAt = version.createdAt
                ? new Date(version.createdAt)
                : null;
              const timeLabel = createdAt
                ? formatSmartDate(createdAt, i18n.language)
                : t("message.no_data_to_display");
              const exactDate = createdAt
                ? normalizeDate(i18n.language, createdAt)
                : undefined;
              const createdByLabel = getUserByVersion(version.createdBy);
              const message = version.message?.trim();

              return (
                <TimelineItem key={version.id} sx={{ minHeight: "auto" }}>
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
                        color: isCurrent
                          ? theme.palette.common.white
                          : actionMeta.color,
                        boxShadow: "none",
                      }}
                    />
                    {index < versions.length - 1 && (
                      <TimelineConnector
                        sx={{ backgroundColor: theme.palette.divider }}
                      />
                    )}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: 0, pb: 2, pr: 1 }}>
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        border: "1px solid #e3e5e8",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        minWidth: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {t("visual_editor.workflow_versions.version", {
                            0: version.version,
                          })}
                        </Typography>
                        <Chip
                          size="small"
                          label={actionMeta.label}
                          sx={{
                            height: 18,
                            fontSize: 10,
                            fontWeight: 600,
                            color: actionMeta.color,
                            backgroundColor: actionMeta.background,
                          }}
                        />
                        {isCurrent && (
                          <Chip
                            size="small"
                            label={t("visual_editor.workflow_versions.current")}
                            sx={{
                              height: 18,
                              fontSize: 10,
                              fontWeight: 600,
                              color: theme.palette.primary.main,
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.12,
                              ),
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        color={message ? "text.primary" : "text.secondary"}
                        sx={{ wordBreak: "break-word" }}
                      >
                        {message ||
                          t("visual_editor.workflow_versions.message_fallback")}
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
            })}
          </Timeline>
        )}
      </Box>
    </Box>
  );
};
