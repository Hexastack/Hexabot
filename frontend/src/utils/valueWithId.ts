/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { generateId } from "./generateId";

export type ValueWithId<T> = {
  id: string;
  value: T;
};

export const createValueWithId = <T>(value: T): ValueWithId<T> => {
  return { id: generateId(), value };
};
