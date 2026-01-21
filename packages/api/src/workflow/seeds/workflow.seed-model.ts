/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';

import { WorkflowCreateDto } from '../dto/workflow.dto';
import { WorkflowType } from '../types';

export const defaultWorkflowDefinition: WorkflowDefinition = {
  workflow: {
    name: 'default',
    version: '1.0.0',
    description: 'Built-in default workflow.',
  },
  tasks: {
    send_welcome: {
      action: 'send_text_message',
      description: 'Send the default welcome message.',
      inputs: {
        text: '="Welcome! How can I help you today."',
      },
    },
  },
  flow: [{ do: 'send_welcome' }],
  outputs: {
    last_message_text: '=$output.send_welcome.text ?? ""',
  },
};

export const workflowModels = (creatorId: string): WorkflowCreateDto[] => [
  {
    name: defaultWorkflowDefinition.workflow.name,
    version: defaultWorkflowDefinition.workflow.version,
    description: defaultWorkflowDefinition.workflow.description ?? undefined,
    definition: defaultWorkflowDefinition,
    type: WorkflowType.conversational,
    schedule: null,
    memoryDefinitions: [],
    createdBy: creatorId,
    builtin: true,
  },
];
