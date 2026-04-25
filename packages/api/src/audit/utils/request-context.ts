/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { Request } from 'express';

const getHeaderValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const resolveRequestId = (req: Request): string => {
  return (
    getHeaderValue(req.headers['x-request-id']) ??
    getHeaderValue(req.headers['x-correlation-id']) ??
    randomUUID()
  );
};

export const resolveRequestIp = (req: Request): string | undefined => {
  const forwardedFor = getHeaderValue(req.headers['x-forwarded-for']);
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip ?? req.socket?.remoteAddress;
};

export const resolveUserAgent = (req: Request): string | undefined => {
  return getHeaderValue(req.headers['user-agent']);
};

export const resolveRequestPath = (req: Request): string | undefined => {
  return req.originalUrl ?? req.url;
};
