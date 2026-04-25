/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { AuditLog } from "@hexabot-ai/types";
import {
  CheckCircle2,
  CircleHelp,
  type LucideIcon,
  XCircle,
} from "lucide-react";

import type { TTranslationKeys } from "@/i18n/i18n.types";

export type AuditStatusTone = "success" | "error" | "warning";

export type AuditStatusMeta = {
  icon: LucideIcon;
  labelKey: TTranslationKeys;
  tone: AuditStatusTone;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value?: string | null): boolean =>
  typeof value === "string" && UUID_PATTERN.test(value);
const isUuidList = (value?: string | null): boolean =>
  typeof value === "string" &&
  value.length > 0 &&
  value.split(",").every((part) => isUuid(part.trim()));
const isTechnicalId = (value?: string | null): boolean =>
  isUuid(value) || isUuidList(value);

export const AUDIT_STATUS_META: Record<
  AuditLog["operationStatus"],
  AuditStatusMeta
> = {
  SUCCEEDED: {
    icon: CheckCircle2,
    labelKey: "label.audit_status_succeeded",
    tone: "success",
  },
  FAILED: {
    icon: XCircle,
    labelKey: "label.audit_status_failed",
    tone: "error",
  },
  UNSPECIFIED: {
    icon: CircleHelp,
    labelKey: "label.audit_status_unspecified",
    tone: "warning",
  },
};

export const getAuditStatusMeta = (
  status: AuditLog["operationStatus"],
): AuditStatusMeta =>
  AUDIT_STATUS_META[status] ?? AUDIT_STATUS_META.UNSPECIFIED;

export const formatAuditActor = (auditLog: AuditLog): string => {
  if (auditLog.actorId === "system") {
    return auditLog.actorId;
  }

  if (!isTechnicalId(auditLog.actorId)) {
    return auditLog.actorId || auditLog.actorType || "user";
  }

  if (auditLog.actorType && !isTechnicalId(auditLog.actorType)) {
    return auditLog.actorType;
  }

  return auditLog.resourceType === "Auth" ? "user" : "system";
};

export const formatAuditResource = (auditLog: AuditLog): string => {
  if (auditLog.resourceType === "Auth" || isTechnicalId(auditLog.resourceId)) {
    return auditLog.resourceType;
  }

  return [auditLog.resourceType, auditLog.resourceId].filter(Boolean).join(" ");
};

export const formatAuditActivity = (auditLog: AuditLog): string =>
  [
    formatAuditActor(auditLog),
    auditLog.operationType,
    formatAuditResource(auditLog),
  ]
    .filter(Boolean)
    .join(" ");

export const normalizeAuditJsonValue = (value: unknown): unknown =>
  value ?? null;
