/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, Scope } from '@nestjs/common';

import { ManualEventWrapper } from '../lib/trigger-event-wrapper';

import { WorkflowRuntimeContext } from './base-workflow-context';

@Injectable({ scope: Scope.TRANSIENT })
export class ManualWorkflowContext extends WorkflowRuntimeContext<ManualEventWrapper> {}
