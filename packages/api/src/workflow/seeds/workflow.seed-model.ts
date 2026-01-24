/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowCreateDto } from '../dto/workflow.dto';
import { WorkflowType } from '../types';

export const workflowModels = (creatorId: string): WorkflowCreateDto[] => [
  {
    name: 'default',
    description: 'Built-in default workflow.',
    type: WorkflowType.conversational,
    schedule: null,
    memoryDefinitions: [],
    createdBy: creatorId,
    builtin: true,
  },
];
