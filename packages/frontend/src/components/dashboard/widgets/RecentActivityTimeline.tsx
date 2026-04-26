/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { AuditLog } from "@hexabot-ai/types";
import { Timeline } from "@mui/lab";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ScrollText } from "lucide-react";

import {
  formatAuditActor,
  getAuditStatusMeta,
} from "@/components/audit/audit-display.utils";
import { useFind } from "@/hooks/crud/useFind";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { formatSmartDate } from "@/utils/date";

import { DashboardTimelineItem } from "../components/DashboardTimelineItem";
import { DashboardWidgetState } from "../components/DashboardWidgetState";
import { IconContainer } from "../components/IconContainer";
import { TitleWithActions } from "../components/TitleWithActions";

const AUTH_ACTIVITY_OPERATIONS = new Set(["login", "logout"]);
const normalizeActivityValue = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};
const isSameActivityValue = (left: string, right?: string): boolean =>
  left.toLocaleLowerCase() === right?.toLocaleLowerCase();
const getActivityResourceTarget = (event: AuditLog): string | undefined =>
  normalizeActivityValue(event.resourceLabel) ??
  normalizeActivityValue(event.resourceId);
const formatActivityAction = (event: AuditLog): string => {
  const operationType = normalizeActivityValue(event.operationType);
  const resourceType = normalizeActivityValue(event.resourceType);
  const shouldHideAuthResource =
    operationType !== undefined &&
    resourceType?.toLocaleLowerCase() === "auth" &&
    AUTH_ACTIVITY_OPERATIONS.has(operationType.toLocaleLowerCase());

  return [operationType, shouldHideAuthResource ? undefined : resourceType]
    .filter(Boolean)
    .join(" ");
};

type ActivityMetaItemProps = {
  label: string;
  value: string;
};

const ActivityMetaItem = ({ label, value }: ActivityMetaItemProps) => (
  <Stack component="span" direction="row" spacing={0.5} alignItems="baseline">
    <Typography
      component="span"
      variant="caption"
      color="text.secondary"
      fontWeight={700}
      sx={{ flexShrink: 0 }}
    >
      {label}
    </Typography>
    <Typography
      component="span"
      variant="caption"
      color="text.primary"
      sx={{ overflowWrap: "anywhere" }}
    >
      {value}
    </Typography>
  </Stack>
);

export const RecentActivityTimeline = () => {
  const theme = useTheme();
  const router = useAppRouter();
  const { t, i18n } = useTranslate();
  const {
    data: auditLogs,
    isLoading,
    isFetching,
    error,
  } = useFind(
    { entity: EntityType.AUDIT_LOG },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "desc" }],
      initialPaginationState: { page: 0, pageSize: 4 },
    },
  );
  const locale = i18n.resolvedLanguage || i18n.language;
  const isInitialLoading = isLoading && auditLogs.length === 0;

  return (
    <Timeline>
      <TitleWithActions
        title={t("dashboard.activity.title")}
        actions={
          <Button
            size="small"
            variant="text"
            startIcon={<ScrollText size={14} />}
            onClick={() => router.push("/audit")}
          >
            {t("button.view")}
          </Button>
        }
      />
      <Box>
        {error ? (
          <DashboardWidgetState
            tone="error"
            title={t("dashboard.activity.error")}
            description={t("dashboard.activity.error_description")}
          />
        ) : null}
        {isInitialLoading ? (
          <DashboardWidgetState
            loading
            title={t("dashboard.activity.loading")}
            description={t("dashboard.activity.loading_description")}
          />
        ) : null}
        {!error &&
        !isInitialLoading &&
        !isFetching &&
        auditLogs.length === 0 ? (
          <DashboardWidgetState
            title={t("dashboard.activity.empty")}
            description={t("dashboard.activity.empty_description")}
          />
        ) : null}
        {!error && !isInitialLoading
          ? auditLogs.map((event) => {
              const statusMeta = getAuditStatusMeta(event.operationStatus);
              const IconType = statusMeta.icon;
              const actor = formatAuditActor(event);
              const activityAction =
                formatActivityAction(event) || t("dashboard.activity.title");
              const resourceTarget = getActivityResourceTarget(event);
              const resourceType = normalizeActivityValue(event.resourceType);
              const shouldShowResourceTarget =
                resourceTarget !== undefined &&
                !isSameActivityValue(resourceTarget, actor) &&
                !isSameActivityValue(resourceTarget, resourceType);

              return (
                <DashboardTimelineItem
                  key={event.id}
                  time={formatSmartDate(event.createdAt, locale)}
                  renderTitle={() => (
                    <Stack
                      direction="row"
                      gap={1.25}
                      alignItems="flex-start"
                      sx={{ minWidth: 0 }}
                    >
                      <Box sx={{ flexShrink: 0 }}>
                        <IconContainer
                          icon={IconType}
                          color={theme.palette[statusMeta.tone].main}
                          borderRadius="16px"
                          size={14}
                        />
                      </Box>
                      <Stack gap={0.5} sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="text.primary"
                          sx={{ overflowWrap: "anywhere" }}
                        >
                          {activityAction}
                        </Typography>
                        <Stack
                          direction="row"
                          gap={1.25}
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ minWidth: 0 }}
                        >
                          <ActivityMetaItem
                            label={t("dashboard.activity.by")}
                            value={actor}
                          />
                          {shouldShowResourceTarget && resourceTarget ? (
                            <ActivityMetaItem
                              label={t("dashboard.activity.target")}
                              value={resourceTarget}
                            />
                          ) : null}
                        </Stack>
                      </Stack>
                    </Stack>
                  )}
                />
              );
            })
          : null}
      </Box>
    </Timeline>
  );
};
