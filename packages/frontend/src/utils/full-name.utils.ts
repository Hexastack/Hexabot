/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type ISubscriberStub } from "@/types/subscriber.types";
import { type IUserStub } from "@/types/user.types";

export const applyFullNameDerivedFields = <
  T extends IUserStub | ISubscriberStub,
>(
  entity: T,
): T => {
  entity.fullName = `${entity.firstName} ${entity.lastName}`;

  return entity;
};
