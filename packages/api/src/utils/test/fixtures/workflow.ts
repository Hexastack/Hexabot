/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { DataSource } from 'typeorm';
import { stringify } from 'yaml';

import { QuickReplyType } from '@/chat/types/quick-reply';
import {
  installUserFixturesTypeOrm,
  userFixtureIds,
} from '@/utils/test/fixtures/user';
import { WorkflowCreateDto } from '@/workflow/dto/workflow.dto';
import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';
import { WorkflowType } from '@/workflow/types';

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

/**
 * Scheduled workflow definition used to validate cron-based execution.
 */
export const scheduledWorkflowDefinition: WorkflowDefinition = {
  workflow: {
    name: 'scheduled_workflow_fixture',
    version: '0.1.0',
    description: 'Test workflow triggered on a schedule.',
  },
  tasks: {
    send_update: {
      // Dummy action used only for scheduled workflow testing.
      action: 'noop_task',
      inputs: {
        note: '="Scheduled workflow executed"',
      },
    },
  },
  flow: [{ do: 'send_update' }],
  outputs: {
    status: '="ok"',
  },
};

export const messagingWorkflowDefinitionYaml = stringify(
  messagingWorkflowDefinition,
);

export const scheduledWorkflowDefinitionYaml = stringify(
  scheduledWorkflowDefinition,
);

export const messagingWorkflowFixtures: WorkflowCreateDto[] = [
  {
    name: messagingWorkflowDefinition.workflow.name,
    version: messagingWorkflowDefinition.workflow.version,
    description: messagingWorkflowDefinition.workflow.description ?? undefined,
    definitionYaml: messagingWorkflowDefinitionYaml,
    type: WorkflowType.conversational,
    schedule: null,
    memoryDefinitions: [],
    createdBy: userFixtureIds.admin,
  },
];

export const scheduledWorkflowFixtures: WorkflowCreateDto[] = [
  {
    name: scheduledWorkflowDefinition.workflow.name,
    version: scheduledWorkflowDefinition.workflow.version,
    description: scheduledWorkflowDefinition.workflow.description ?? undefined,
    definitionYaml: scheduledWorkflowDefinitionYaml,
    type: WorkflowType.scheduled,
    schedule: '*/10 * * * * *',
    memoryDefinitions: [],
    createdBy: userFixtureIds.admin,
  },
];

export const installScheduledWorkflowFixturesTypeOrm = async (
  dataSource: DataSource,
): Promise<WorkflowOrmEntity[]> => {
  await installUserFixturesTypeOrm(dataSource);
  const repository = dataSource.getRepository(WorkflowOrmEntity);

  if (await repository.count()) {
    return await repository.find({ relations: ['createdBy'] });
  }

  const entities = repository.create(
    scheduledWorkflowFixtures.map((fixture) => ({
      ...fixture,
      createdBy: fixture.createdBy ? { id: fixture.createdBy } : undefined,
      memoryDefinitions: fixture.memoryDefinitions?.map((definitionId) => ({
        id: definitionId,
      })),
    })),
  );

  return await repository.save(entities);
};

export const installMessagingWorkflowFixturesTypeOrm = async (
  dataSource: DataSource,
): Promise<WorkflowOrmEntity[]> => {
  await installUserFixturesTypeOrm(dataSource);
  const repository = dataSource.getRepository(WorkflowOrmEntity);

  if (await repository.count()) {
    return await repository.find();
  }

  const entities = repository.create(
    messagingWorkflowFixtures.map((fixture) => ({
      ...fixture,
      createdBy: fixture.createdBy ? { id: fixture.createdBy } : undefined,
      memoryDefinitions: fixture.memoryDefinitions?.map((definitionId) => ({
        id: definitionId,
      })),
    })),
  );

  return await repository.save(entities);
};
