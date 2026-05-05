/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { McpToken } from "@hexabot-ai/types";

export type McpTokenStatus = "active" | "expired" | "revoked";

const toDate = (date: Date | string) =>
  date instanceof Date ? date : new Date(date);

export const getMcpTokenStatus = (
  token: Pick<McpToken, "expiresAt" | "revokedAt">,
  now = new Date(),
): McpTokenStatus => {
  if (token.revokedAt) {
    return "revoked";
  }

  if (token.expiresAt && toDate(token.expiresAt).getTime() <= now.getTime()) {
    return "expired";
  }

  return "active";
};

export const toMcpTokenCreatePayload = ({
  name,
  expiresAt,
}: {
  name: string;
  expiresAt?: string;
}) => ({
  name: name.trim(),
  expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
});

export const formatOptionalDate = (
  date: Date | string | null | undefined,
  locale?: string,
) => {
  if (!date) {
    return null;
  }

  const parsedDate = toDate(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toLocaleString(locale);
};
