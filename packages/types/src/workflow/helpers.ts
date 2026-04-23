/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { subscriberSchema } from "../chat/subscriber";
import { toRecord } from "../shared/object";
import { userSchema } from "../user/user";

export const nullishToNull = (value: unknown): unknown => {
  return value == null ? null : value;
};

export const userOrSubscriberSchema = z.union([
  z.lazy(() => userSchema),
  subscriberSchema,
]);

export const parseUserOrSubscriber = (
  value: unknown,
): z.infer<typeof userOrSubscriberSchema> => {
  const record = toRecord(value);

  if (record?.type === "UserOrmEntity") {
    return userSchema.parse(value);
  }
  if (record?.type === "SubscriberOrmEntity") {
    return subscriberSchema.parse(value);
  }

  const parsedUser = userSchema.safeParse(value);
  if (parsedUser.success) {
    return parsedUser.data;
  }

  return subscriberSchema.parse(value);
};
