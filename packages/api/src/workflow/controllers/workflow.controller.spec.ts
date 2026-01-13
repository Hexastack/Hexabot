/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TestingModule } from '@nestjs/testing';
import { stringify } from 'yaml';

import { ActionService } from '@/actions/actions.service';
import { SendTextMessageAction } from '@/extensions/actions/messaging/text-message.action';
import { LoggerService } from '@/logger/logger.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { userFixtureIds } from '@/utils/test/fixtures/user';
import {
  installMessagingWorkflowFixturesTypeOrm,
  installScheduledWorkflowFixturesTypeOrm,
  messagingWorkflowDefinition,
  messagingWorkflowDefinitionYaml,
  messagingWorkflowFixtures,
} from '@/utils/test/fixtures/workflow';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ManualWorkflowContext } from '../contexts/manual-workflow.context';
import { WorkflowUpdateDto } from '../dto/workflow.dto';
import { ManualEventWrapper } from '../lib/trigger-event-wrapper';
import { parseWorkflowDefinition } from '../lib/workflow-definition';
import { AgenticService } from '../services/agentic.service';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowType } from '../types';

import { WorkflowController } from './workflow.controller';

describe('WorkflowController (TypeORM)', () => {
  let module: TestingModule;
  let workflowController: WorkflowController;
  let workflowService: WorkflowService;
  let agenticService: AgenticService;
  let logger: LoggerService;
  let actionService: ActionService;
  const createdWorkflowIds = new Set<string>();
  let counter = 0;

  const buildWorkflowPayload = () => {
    const definition = {
      workflow: {
        name: `workflow_${++counter}`,
        version: `1.0.${counter}`,
        description: 'Workflow controller test definition',
      },
      tasks: {
        send_greeting: {
          action: 'send_text_message',
          inputs: { text: '="Hi"' },
        },
      },
      flow: [{ do: 'send_greeting' }],
      outputs: { result: '=1' },
    };

    return {
      name: definition.workflow.name,
      version: definition.workflow.version,
      description: definition.workflow.description,
      type: WorkflowType.conversational,
      schedule: null,
      definitionYaml: stringify(definition),
      memoryDefinitions: [],
      createdBy: userFixtureIds.admin,
    };
  };

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [WorkflowController],
      providers: [
        {
          provide: ModuleRef,
          useValue: {
            resolve: () => new ManualWorkflowContext(),
          },
        },
        I18nServiceProvider,
      ],
      typeorm: {
        fixtures: [
          installMessagingWorkflowFixturesTypeOrm,
          installScheduledWorkflowFixturesTypeOrm,
        ],
      },
    });
    module = testingModule;
    [agenticService, workflowController, workflowService, actionService] =
      await getMocks([
        AgenticService,
        WorkflowController,
        WorkflowService,
        ActionService,
      ]);
    logger = workflowController.logger;
    actionService.register(new SendTextMessageAction(actionService));
  });

  afterEach(async () => {
    jest.clearAllMocks();
    const ids = Array.from(createdWorkflowIds);

    for (const id of ids) {
      await workflowService.deleteOne(id);
      createdWorkflowIds.delete(id);
    }
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('findMany', () => {
    it('returns workflows matching the provided filters', async () => {
      const options = {
        where: { name: messagingWorkflowDefinition.workflow.name },
      };
      const findSpy = jest.spyOn(workflowService, 'find');
      const result = await workflowController.findMany(options);

      expect(findSpy).toHaveBeenCalledWith(options);
      expect(result).toEqualPayload(
        [
          {
            ...messagingWorkflowFixtures[0],
            definition: messagingWorkflowDefinition,
            definitionYaml: messagingWorkflowDefinitionYaml,
          },
        ],
        [...IGNORED_TEST_FIELDS],
      );
    });
  });

  describe('create', () => {
    it('creates a workflow definition', async () => {
      const payload = buildWorkflowPayload();
      const createSpy = jest.spyOn(workflowService, 'create');
      const userId = userFixtureIds.admin;
      const created = await workflowController.create(payload, {
        session: { passport: { user: { id: userId } } },
      } as any);
      createdWorkflowIds.add(created.id);

      expect(createSpy).toHaveBeenCalledWith({
        ...payload,
        createdBy: userId,
      });
      expect(created).toEqualPayload(
        {
          ...payload,
          definition: parseWorkflowDefinition(payload.definitionYaml),
          createdBy: userId,
        },
        [...IGNORED_TEST_FIELDS],
      );
    });
  });

  describe('findOne', () => {
    it('returns a workflow when it exists', async () => {
      const [existing] = await workflowService.find({ take: 1 });
      expect(existing).toBeDefined();

      const findSpy = jest.spyOn(workflowService, 'findOne');
      const result = await workflowController.findOne(existing.id, []);

      expect(findSpy).toHaveBeenCalledWith(existing.id);
      expect(result).toEqualPayload(existing);
    });

    it('throws NotFoundException when workflow is missing', async () => {
      const id = randomUUID();
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(workflowController.findOne(id, [])).rejects.toThrow(
        new NotFoundException(`Workflow with ID ${id} not found`),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        `Unable to find Workflow by id ${id}`,
      );
    });
  });

  describe('updateOne', () => {
    it('updates an existing workflow', async () => {
      const created = await workflowService.create({
        ...buildWorkflowPayload(),
        createdBy: userFixtureIds.admin,
      });
      createdWorkflowIds.add(created.id);
      const updates: WorkflowUpdateDto = { description: 'Updated workflow' };
      const findOneSpy = jest.spyOn(workflowService, 'findOne');
      const updateSpy = jest.spyOn(workflowService, 'updateOne');
      const result = await workflowController.updateOne(created.id, updates);

      expect(findOneSpy).toHaveBeenCalledWith(created.id);
      expect(updateSpy).toHaveBeenCalledWith(created.id, updates);
      expect(result).toEqualPayload(
        { ...created, ...updates, createdBy: userFixtureIds.admin },
        [...IGNORED_TEST_FIELDS],
      );
    });

    it('throws NotFoundException when attempting to update a missing workflow', async () => {
      const id = randomUUID();
      const updateSpy = jest.spyOn(workflowService, 'updateOne');
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(
        workflowController.updateOne(id, { description: 'Missing workflow' }),
      ).rejects.toThrow(
        new NotFoundException(`Workflow with ID ${id} not found`),
      );

      expect(updateSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        `Unable to update Workflow by id ${id}`,
      );
    });
  });

  describe('deleteOne', () => {
    it('removes an existing workflow', async () => {
      const created = await workflowService.create(buildWorkflowPayload());
      createdWorkflowIds.add(created.id);
      const deleteSpy = jest.spyOn(workflowService, 'deleteOne');
      const result = await workflowController.deleteOne(created.id);

      expect(deleteSpy).toHaveBeenCalledWith(created.id);
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
      expect(await workflowService.findOne(created.id)).toBeNull();
    });

    it('throws NotFoundException when deletion does not remove anything', async () => {
      const id = randomUUID();
      const deleteSpy = jest.spyOn(workflowService, 'deleteOne');
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(workflowController.deleteOne(id)).rejects.toThrow(
        new NotFoundException(`Workflow with ID ${id} not found`),
      );
      expect(deleteSpy).toHaveBeenCalledWith(id);
      expect(warnSpy).toHaveBeenCalledWith(
        `Unable to delete Workflow by id ${id}`,
      );
    });
  });

  describe('runManually', () => {
    it('runs a scheduled workflow for an authenticated user', async () => {
      const scheduled = await workflowService.create({
        ...buildWorkflowPayload(),
        type: WorkflowType.scheduled,
        schedule: '*/5 * * * * *',
        createdBy: userFixtureIds.admin,
      });
      createdWorkflowIds.add(scheduled.id);
      const input = { run: true };
      const userId = userFixtureIds.admin;
      const spyAgenticService = jest.spyOn(agenticService, 'handleEvent');
      const result = await workflowController.runManually(scheduled.id, input, {
        session: { passport: { user: { id: userId } } },
      } as any);
      expect(spyAgenticService).toHaveBeenCalledTimes(1);
      spyAgenticService.mockImplementation(async (eventArg, workflowArg) => {
        expect(workflowArg?.id).toEqual(scheduled.id);
        expect(eventArg).toBeInstanceOf(ManualEventWrapper);
        expect(eventArg.buildInput()).toEqual(input);
        expect(eventArg.getInitiator()?.id).toEqual(userId);
        expect(eventArg.getMetadata()).toEqual(
          expect.objectContaining({
            trigger: WorkflowType.manual,
            initiated_by: userId,
          }),
        );
      });

      expect(result).toEqual({ accepted: true });
    });

    it('rejects manual execution for conversational workflows', async () => {
      const [conversational] = await workflowService.find({
        where: { type: WorkflowType.conversational },
        take: 1,
      });
      expect(conversational).toBeDefined();

      await expect(
        workflowController.runManually(conversational.id, {}, {
          session: { passport: { user: { id: userFixtureIds.admin } } },
        } as any),
      ).rejects.toThrow(
        new BadRequestException(
          'Workflow must be manual or scheduled to run manually',
        ),
      );
      expect(agenticService.handleEvent).not.toHaveBeenCalled();
    });

    it('throws when user session is missing', async () => {
      const scheduled = await workflowService.create({
        ...buildWorkflowPayload(),
        type: WorkflowType.scheduled,
        schedule: '*/5 * * * * *',
        createdBy: userFixtureIds.admin,
      });
      createdWorkflowIds.add(scheduled.id);

      await expect(
        workflowController.runManually(scheduled.id, {}, {} as any),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Only authenticated users can run workflows manually',
        ),
      );
      expect(agenticService.handleEvent).not.toHaveBeenCalled();
    });
  });
});
