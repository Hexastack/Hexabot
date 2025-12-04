/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { DataSource } from 'typeorm';

import { QuickReplyType } from '@/chat/types/quick-reply';
import { WorkflowCreateDto } from '@/workflow/dto/workflow.dto';
import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';

/**
 * Simple workflow definition that exercises the built-in messaging actions.
 * It sends an initial text and follows up with a quick reply prompt.
 */
export const messagingWorkflowDefinition: WorkflowDefinition = {
  workflow: {
    name: 'messaging_workflow_fixture',
    version: '0.1.0',
    description: 'Test workflow using messaging actions.',
  },
  tasks: {
    send_greeting: {
      action: 'send_text_message',
      inputs: {
        text: '="Welcome to Hexabot! Let us know how to help."',
      },
    },
    prompt_next_step: {
      action: 'send_quick_replies',
      description: 'Offer quick replies to continue the conversation.',
      inputs: {
        text: '="What would you like to do next?"',
        quick_replies: [
          {
            content_type: QuickReplyType.text,
            title: 'Get help',
            payload: 'help',
          },
          {
            content_type: QuickReplyType.text,
            title: 'Talk to agent',
            payload: 'agent',
          },
        ],
      },
    },
  },
  flow: [{ do: 'send_greeting' }, { do: 'prompt_next_step' }],
  outputs: {
    last_prompt: '=$output.prompt_next_step.text ?? ""',
  },
};

export const messagingWorkflowFixtures: WorkflowCreateDto[] = [
  {
    name: messagingWorkflowDefinition.workflow.name,
    version: messagingWorkflowDefinition.workflow.version,
    description: messagingWorkflowDefinition.workflow.description ?? undefined,
    definition: messagingWorkflowDefinition,
    source: JSON.stringify(messagingWorkflowDefinition, null, 2),
  },
];

export const installMessagingWorkflowFixturesTypeOrm = async (
  dataSource: DataSource,
): Promise<WorkflowOrmEntity[]> => {
  const repository = dataSource.getRepository(WorkflowOrmEntity);

  if (await repository.count()) {
    return await repository.find();
  }

  const entities = repository.create(messagingWorkflowFixtures);

  return await repository.save(entities);
};
