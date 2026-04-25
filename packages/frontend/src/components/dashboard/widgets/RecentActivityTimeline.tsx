/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Timeline } from "@mui/lab";
import { Alert, Box, Button, Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ScrollText } from "lucide-react";

import {
  formatAuditActor,
  formatAuditResource,
  getAuditStatusMeta,
} from "@/components/audit/audit-display.utils";
import { useFind } from "@/hooks/crud/useFind";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { formatSmartDate } from "@/utils/date";

import { DashboardTimelineItem } from "../components/DashboardTimelineItem";
import { IconContainer } from "../components/IconContainer";
import { TitleWithActions } from "../components/TitleWithActions";

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
          <Alert severity="error">{t("dashboard.activity.error")}</Alert>
        ) : null}
        {isLoading || isFetching ? (
          <Alert severity="info">{t("dashboard.activity.loading")}</Alert>
        ) : null}
        {!error && !isLoading && !isFetching && auditLogs.length === 0 ? (
          <Alert severity="info">{t("dashboard.activity.empty")}</Alert>
        ) : null}
        {!error && !isLoading && !isFetching
          ? auditLogs.map((event) => {
              const statusMeta = getAuditStatusMeta(event.operationStatus);
              const IconType = statusMeta.icon;
              const actor = formatAuditActor(event);
              const activityDetails = [
                event.operationType,
                formatAuditResource(event),
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <DashboardTimelineItem
                  key={event.id}
                  time={formatSmartDate(event.createdAt, locale)}
                  secondaryText={event.requestPath ?? undefined}
                  renderTitle={() => (
                    <Grid display="flex" gap={1} alignItems="center">
                      <IconContainer
                        icon={IconType}
                        color={theme.palette[statusMeta.tone].main}
                        borderRadius="16px"
                        size={14}
                      />
                      <Typography variant="caption">
                        <Box
                          component="span"
                          fontWeight="bold"
                          color="text.primary"
                        >
                          {actor}
                        </Box>{" "}
                        {activityDetails}
                      </Typography>
                    </Grid>
                  )}
                />
              );
            })
          : null}
      </Box>
    </Timeline>
  );
};
