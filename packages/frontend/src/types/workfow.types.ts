/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowType } from "@hexabot-ai/types";

export { WorkflowType };

export interface IWorkflowFilters {
  name: string;
  version: string;
  description: string;
  type: WorkflowType;
  runAfterMs: number;
}
