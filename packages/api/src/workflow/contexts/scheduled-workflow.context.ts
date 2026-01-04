/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, Scope } from '@nestjs/common';

import { ScheduledEventWrapper } from '../lib/trigger-event-wrapper';

import { WorkflowRuntimeContext } from './workflow-runtime.context';

@Injectable({ scope: Scope.TRANSIENT })
export class ScheduledWorkflowContext extends WorkflowRuntimeContext<ScheduledEventWrapper> {
  event: ScheduledEventWrapper;
}
