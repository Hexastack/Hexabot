/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { AuditLog } from "@hexabot-ai/types";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";

import { DrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { JsonViewer } from "@/app-components/inputs/JsonViewer";
import { useTranslate } from "@/hooks/useTranslate";
import type { TTranslationKeys } from "@/i18n/i18n.types";
import { getDateTimeFormatter } from "@/utils/date";

import {
  getAuditStatusMeta,
  normalizeAuditJsonValue,
} from "./audit-display.utils";

type AuditLogDetailsDrawerProps = {
  auditLog: AuditLog | null;
  onClose: () => void;
};

type DetailField = {
  labelKey: TTranslationKeys;
  value?: string | null;
};

const EMPTY_VALUE = "-";
const DetailRow = ({ labelKey, value }: DetailField) => {
  const { t } = useTranslate();

  return (
    <Stack gap={0.5}>
      <Typography variant="caption" color="text.secondary">
        {t(labelKey)}
      </Typography>
      <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
        {value || EMPTY_VALUE}
      </Typography>
    </Stack>
  );
};

export const AuditLogDetailsDrawer = ({
  auditLog,
  onClose,
}: AuditLogDetailsDrawerProps) => {
  const { t } = useTranslate();
  const statusMeta = auditLog
    ? getAuditStatusMeta(auditLog.operationStatus)
    : null;
  const StatusIcon = statusMeta?.icon;
  const metadataFields: DetailField[] = auditLog
    ? [
        {
          labelKey: "label.createdAt",
          value: t(
            "datetime.created_at",
            getDateTimeFormatter(auditLog.createdAt),
          ),
        },
        { labelKey: "label.operation_type", value: auditLog.operationType },
        { labelKey: "label.operation_id", value: auditLog.operationId },
        { labelKey: "label.resource_type", value: auditLog.resourceType },
        { labelKey: "label.resource_id", value: auditLog.resourceId },
        { labelKey: "label.resource_label", value: auditLog.resourceLabel },
        { labelKey: "label.actor_id", value: auditLog.actorId },
        { labelKey: "label.actor_type", value: auditLog.actorType },
        { labelKey: "label.actor_label", value: auditLog.actorLabel },
        { labelKey: "label.actor_ip", value: auditLog.actorIp },
        { labelKey: "label.actor_agent", value: auditLog.actorAgent },
        { labelKey: "label.request_id", value: auditLog.requestId },
        { labelKey: "label.request_method", value: auditLog.requestMethod },
        { labelKey: "label.request_path", value: auditLog.requestPath },
      ]
    : [];
  const jsonSections: Array<{ labelKey: TTranslationKeys; value: unknown }> =
    auditLog
      ? [
          { labelKey: "label.data_before", value: auditLog.dataBefore },
          { labelKey: "label.data_after", value: auditLog.dataAfter },
          { labelKey: "label.data_diff", value: auditLog.dataDiff },
          { labelKey: "label.raw", value: auditLog.raw },
        ]
      : [];

  return (
    <DrawerLayout
      open={!!auditLog}
      onClose={onClose}
      title={t("title.audit_log_details")}
      closeLabel={t("button.close")}
    >
      {auditLog ? (
        <Stack gap={2}>
          <Stack direction="row" alignItems="center" gap={1}>
            {StatusIcon ? <StatusIcon size={18} /> : null}
            {statusMeta ? (
              <Chip
                size="small"
                color={statusMeta.tone}
                label={t(statusMeta.labelKey)}
              />
            ) : null}
          </Stack>

          <Stack gap={1.5}>
            {metadataFields.map((field) => (
              <DetailRow key={field.labelKey} {...field} />
            ))}
          </Stack>

          <Divider />

          <Stack gap={2}>
            {jsonSections.map(({ labelKey, value }) => (
              <Stack key={labelKey} gap={1}>
                <Typography variant="subtitle2">{t(labelKey)}</Typography>
                <Box
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    height: 240,
                    overflow: "hidden",
                  }}
                >
                  <JsonViewer value={normalizeAuditJsonValue(value)} />
                </Box>
              </Stack>
            ))}
          </Stack>
        </Stack>
      ) : null}
    </DrawerLayout>
  );
};
