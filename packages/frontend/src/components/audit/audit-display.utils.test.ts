/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { AuditLog } from "@hexabot-ai/types";
import { CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  formatAuditActor,
  formatAuditActivity,
  formatAuditResource,
  getAuditStatusMeta,
  normalizeAuditJsonValue,
} from "./audit-display.utils";

const baseAuditLog: AuditLog = {
  id: "audit_1",
  createdAt: new Date("2026-04-25T10:00:00.000Z"),
  updatedAt: new Date("2026-04-25T10:00:00.000Z"),
  resourceId: "user_1",
  resourceType: "User",
  resourceLabel: null,
  operationId: "typeorm.User.update",
  operationType: "Update",
  operationStatus: "SUCCEEDED",
  actorId: "admin_1",
  actorType: "admin",
  actorLabel: null,
  actorIp: null,
  actorAgent: null,
  requestId: null,
  requestMethod: "PATCH",
  requestPath: "/api/user/user_1",
  dataBefore: null,
  dataAfter: null,
  dataDiff: null,
  raw: null,
};

describe("audit display utils", () => {
  it("formats audit activity as actor operation resource", () => {
    expect(formatAuditActivity(baseAuditLog)).toBe(
      "admin_1 Update User user_1",
    );
  });

  it("prefers actor and resource labels when present", () => {
    const labeledAuditLog: AuditLog = {
      ...baseAuditLog,
      resourceId: "ff227083-cfce-4abb-a566-19df8d9ba991",
      resourceType: "Workflow",
      resourceLabel: "Customer intake",
      actorId: "0a575e2b-6cec-45e7-b098-9a4434d189c2",
      actorLabel: "Ada Lovelace (ada)",
    };

    expect(formatAuditActor(labeledAuditLog)).toBe("Ada Lovelace (ada)");
    expect(formatAuditResource(labeledAuditLog)).toBe(
      "Workflow Customer intake",
    );
    expect(formatAuditActivity(labeledAuditLog)).toBe(
      "Ada Lovelace (ada) Update Workflow Customer intake",
    );
  });

  it("uses raw stored IDs when labels are missing", () => {
    const sourceAuditLog: AuditLog = {
      ...baseAuditLog,
      resourceId: "ff227083-cfce-4abb-a566-19df8d9ba991",
      resourceType: "Source",
      operationType: "Create",
      actorId: "0a575e2b-6cec-45e7-b098-9a4434d189c2",
      actorType: "0d36ee69-b8ad-4a08-9685-6858eaf1f90d",
    };
    const loginAuditLog: AuditLog = {
      ...baseAuditLog,
      resourceId: "0a575e2b-6cec-45e7-b098-9a4434d189c2",
      resourceType: "Auth",
      operationType: "Login",
      actorId: "0a575e2b-6cec-45e7-b098-9a4434d189c2",
      actorType: "0d36ee69-b8ad-4a08-9685-6858eaf1f90d",
    };

    expect(formatAuditActivity(sourceAuditLog)).toBe(
      "0a575e2b-6cec-45e7-b098-9a4434d189c2 Create Source ff227083-cfce-4abb-a566-19df8d9ba991",
    );
    expect(formatAuditActor(loginAuditLog)).toBe(
      "0a575e2b-6cec-45e7-b098-9a4434d189c2",
    );
    expect(formatAuditActivity(loginAuditLog)).toBe(
      "0a575e2b-6cec-45e7-b098-9a4434d189c2 Login Auth 0a575e2b-6cec-45e7-b098-9a4434d189c2",
    );
  });

  it("maps audit statuses to display metadata", () => {
    expect(getAuditStatusMeta("SUCCEEDED")).toMatchObject({
      icon: CheckCircle2,
      labelKey: "label.audit_status_succeeded",
      tone: "success",
    });
    expect(getAuditStatusMeta("FAILED")).toMatchObject({
      icon: XCircle,
      labelKey: "label.audit_status_failed",
      tone: "error",
    });
    expect(getAuditStatusMeta("UNSPECIFIED")).toMatchObject({
      icon: CircleHelp,
      labelKey: "label.audit_status_unspecified",
      tone: "warning",
    });
  });

  it("keeps JSON values renderable when details are absent", () => {
    expect(normalizeAuditJsonValue(undefined)).toBeNull();
    expect(normalizeAuditJsonValue(null)).toBeNull();
    expect(normalizeAuditJsonValue({ changed: true })).toEqual({
      changed: true,
    });
  });
});
