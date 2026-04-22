/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action, type Permission as SharedPermission } from "@hexabot-ai/types";

export { Action };

export type IPermissionAttributes = Pick<
  SharedPermission,
  "action" | "model" | "role" | "relation"
>;
