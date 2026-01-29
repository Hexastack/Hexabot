/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EWorkflowRunStatus } from "@/types/workflow-run.types";

export type RunHistoryItem = {
  id: string;
  timestamp: string;
  initiator: string;
  status: EWorkflowRunStatus;
  label: string;
};

export type InitiatorIdentity = {
  id?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
};
