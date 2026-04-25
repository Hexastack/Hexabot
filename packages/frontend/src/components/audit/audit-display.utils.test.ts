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
  getAuditStatusMeta,
  normalizeAuditJsonValue,
} from "./audit-display.utils";

const baseAuditLog: AuditLog = {
  id: "audit_1",
  createdAt: new Date("2026-04-25T10:00:00.000Z"),
  updatedAt: new Date("2026-04-25T10:00:00.000Z"),
  resourceId: "user_1",
  resourceType: "User",
  operationId: "typeorm.User.update",
  operationType: "Update",
  operationStatus: "SUCCEEDED",
  actorId: "admin_1",
  actorType: "admin",
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

  it("hides technical UUIDs from compact activity text", () => {
    const sourceAuditLog: AuditLog = {
      ...baseAuditLog,
      resourceId: "ff227083-cfce-4abb-a566-19df8d9ba991",
      resourceType: "Source",
      operationType: "Create",
      actorId: "system",
      actorType: "system",
    };
    const loginAuditLog: AuditLog = {
      ...baseAuditLog,
      resourceId: "0a575e2b-6cec-45e7-b098-9a4434d189c2",
      resourceType: "Auth",
      operationType: "Login",
      actorId: "0a575e2b-6cec-45e7-b098-9a4434d189c2",
      actorType: "0d36ee69-b8ad-4a08-9685-6858eaf1f90d",
    };

    expect(formatAuditActivity(sourceAuditLog)).toBe("system Create Source");
    expect(formatAuditActor(loginAuditLog)).toBe("user");
    expect(formatAuditActivity(loginAuditLog)).toBe("user Login Auth");
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
