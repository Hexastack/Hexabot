/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Workflow as AgenticWorkflow,
  WorkflowDefinition,
  WorkflowEventMap,
} from '@hexabot-ai/agentic';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HookEventKey, OnEvent } from '@nestjs/event-emitter';
import { FindOneOptions } from 'typeorm';

import { BaseOrmService } from '@/utils/generics/base-orm.service';
import {
  Room,
  SocketGet,
  SocketPost,
  SocketReq,
  SocketRequest,
  SocketRes,
  SocketResponse,
  WebsocketGateway,
} from '@/websocket';

import {
  Workflow as WorkflowDto,
  WorkflowDtoConfig,
  WorkflowFull,
  WorkflowNewVersionDto,
  WorkflowTransformerDto,
  WorkflowVersionCommitDto,
} from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { parseWorkflowDefinition } from '../lib/workflow-definition';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowType, WorkflowVersionAction } from '../types';

import { WorkflowRunService } from './workflow-run.service';
import { WorkflowVersionService } from './workflow-version.service';

@Injectable()
export class WorkflowService extends BaseOrmService<
  WorkflowOrmEntity,
  WorkflowTransformerDto,
  WorkflowDtoConfig
> {
  /**
   * Creates the workflow service with the injected repository.
   *
   * @param repository - ORM repository used to manage workflow entities.
   */
  constructor(
    readonly repository: WorkflowRepository,
    private readonly gateway: WebsocketGateway,
    private readonly workflowRunService: WorkflowRunService,
    private readonly workflowVersionService: WorkflowVersionService,
  ) {
    super(repository);
  }

  /**
   * Pick the most recently created workflow if one exists.
   */
  async pickWorkflow(): Promise<WorkflowFull | null> {
    const [latest] = await this.findAndPopulate({
      order: { createdAt: 'DESC' },
      take: 1,
    });

    return latest ?? null;
  }

  /**
   * Create a workflow and persist the initial version snapshot.
   *
   * @param payload - Workflow creation payload including the definition.
   * @returns The created workflow with the current version set.
   */
  async create(payload: WorkflowNewVersionDto) {
    const { definitionYml, message, ...workflowPayload } = payload;
    const workflow = await super.create(workflowPayload);
    const version = await this.workflowVersionService.createSnapshot({
      workflow: workflow.id,
      definitionYml,
      message,
      action: WorkflowVersionAction.create,
      createdBy: payload.createdBy ?? null,
    });

    return await super.updateOne(workflow.id, {
      currentVersion: version.id,
    });
  }

  /**
   * Update a workflow and optionally create a new version snapshot.
   *
   * @param idOrOptions - Workflow id or lookup options.
   * @param payload - Update payload with optional definition.
   * @returns The updated workflow.
   */
  async updateOne(
    idOrOptions: string | FindOneOptions<WorkflowOrmEntity>,
    payload: WorkflowVersionCommitDto,
  ): Promise<WorkflowDto> {
    const { definitionYml, message, ...workflowPayload } = payload;

    if (!definitionYml) {
      return await super.updateOne(idOrOptions, workflowPayload);
    }

    const workflow = await this.findOne({
      ...(typeof idOrOptions === 'string'
        ? { where: { id: idOrOptions } }
        : idOrOptions),
    });

    if (!workflow) {
      const id = typeof idOrOptions === 'string' ? idOrOptions : 'unknown';
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    const version = await this.workflowVersionService.createSnapshot({
      workflow: workflow.id,
      definitionYml,
      message,
      action: WorkflowVersionAction.update,
      createdBy: payload?.updatedBy ?? null,
      parentVersionId: workflow.currentVersion ?? null,
    });

    return super.updateOne(idOrOptions, {
      ...workflowPayload,
      currentVersion: version.id,
    });
  }

  /**
   * Restore a workflow to a prior version by creating a new snapshot.
   *
   * @param workflowId - Workflow identifier.
   * @param versionId - Version identifier to restore.
   * @param payload - Optional restore metadata.
   * @returns The updated workflow pointing at the restored version.
   */
  async restoreVersion(
    workflowId: string,
    versionId: string,
    payload?: {
      updatedBy?: string | null;
      message?: string | null;
    },
  ): Promise<WorkflowDto> {
    const workflow = await this.findOneAndPopulate(workflowId);

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
    }

    const targetVersion = await this.workflowVersionService.findOne({
      where: { id: versionId, workflow: { id: workflowId } },
    });

    if (!targetVersion) {
      throw new NotFoundException(
        `Workflow version with ID ${versionId} not found`,
      );
    }

    const restoredVersion = await this.workflowVersionService.createSnapshot({
      workflow: workflow.id,
      definitionYml: targetVersion.definitionYml,
      message: payload?.message ?? undefined,
      action: WorkflowVersionAction.restore,
      createdBy: payload?.updatedBy ?? null,
      parentVersionId: targetVersion.id,
    });

    return super.updateOne(workflowId, {
      currentVersion: restoredVersion.id,
    });
  }

  /**
   * Internally subscribe web-sockets to user's event
   * For example : Notify chat if new user interacted with the chatbot
   *
   * @param req - The socket request object
   * @param res - The socket response object
   */
  @SocketGet('/workflow/subscribe/')
  @SocketPost('/workflow/subscribe/')
  async subscribe(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ) {
    try {
      const subscribeRoom = await this.gateway.joinSockets(
        req,
        Room.WORKFLOW,
        'workflow',
      );

      return res.status(200).json({
        success: true,
        subscribe: subscribeRoom,
      });
    } catch (e) {
      this.logger.error('Websocket subscription', e);
      throw new InternalServerErrorException(e);
    }
  }

  private async sendWorkflowEvent(
    workflowEvent: HookEventKey,
    payload: WorkflowEventMap[keyof WorkflowEventMap],
  ) {
    const t = Date.now();

    if (!payload.runId) {
      this.logger.error('runId is required');

      return;
    }
    const workflowRun = await this.workflowRunService.findOne(payload.runId);
    if (!workflowRun?.context) {
      this.logger.error('workflowRun context is required');

      return;
    }
    const { initiatorId, workflowId } = workflowRun?.context;
    const workflow = await this.findOne(workflowId);
    const canBroadcastEvents =
      initiatorId &&
      workflow?.type &&
      [WorkflowType.conversational].includes(workflow.type);

    if (canBroadcastEvents) {
      this.gateway.broadcastWorkflowEvent({
        ...payload,
        t,
        initiatorId,
        workflowEvent: workflowEvent.replace('hook:', ''),
      });
    }
  }

  @OnEvent('hook:workflow:start')
  sendWorkflowStart(payload: WorkflowEventMap[keyof WorkflowEventMap]) {
    this.sendWorkflowEvent('hook:workflow:start', payload);
  }

  @OnEvent('hook:workflow:finish')
  sendWorkflowFinish(payload: WorkflowEventMap[keyof WorkflowEventMap]) {
    this.sendWorkflowEvent('hook:workflow:finish', payload);
  }

  @OnEvent('hook:workflow:failure')
  sendWorkflowFailure(payload: WorkflowEventMap[keyof WorkflowEventMap]) {
    this.sendWorkflowEvent('hook:workflow:failure', payload);
  }

  @OnEvent('hook:step:start')
  sendWorkflowStepStart(payload: WorkflowEventMap[keyof WorkflowEventMap]) {
    this.sendWorkflowEvent('hook:step:start', payload);
  }

  @OnEvent('hook:step:suspended')
  sendWorkflowStepSuspended(payload: WorkflowEventMap[keyof WorkflowEventMap]) {
    this.sendWorkflowEvent('hook:step:suspended', payload);
  }

  @OnEvent('hook:step:success')
  sendWorkflowStepSuccess(payload: WorkflowEventMap[keyof WorkflowEventMap]) {
    this.sendWorkflowEvent('hook:step:success', payload);
  }

  @OnEvent('hook:step:error')
  sendWorkflowStepError(payload: WorkflowEventMap[keyof WorkflowEventMap]) {
    this.sendWorkflowEvent('hook:step:error', payload);
  }

  private resolveDefinitionYml(payload: {
    definition?: WorkflowDefinition;
    definitionYml?: string | null;
  }): string {
    const hasDefinition = payload.definition !== undefined;
    const hasDefinitionYml = payload.definitionYml !== undefined;

    if (hasDefinition && hasDefinitionYml) {
      throw new BadRequestException(
        'Provide either definition or definitionYml, not both',
      );
    }

    if (!hasDefinition && !hasDefinitionYml) {
      throw new BadRequestException('Workflow definition is required');
    }

    if (payload.definitionYml !== undefined) {
      const definitionYml = payload.definitionYml ?? '';
      if (definitionYml.trim() === '') {
        throw new BadRequestException('Workflow definition is required');
      }

      parseWorkflowDefinition(definitionYml);

      return definitionYml;
    }

    const definition = payload.definition as WorkflowDefinition;

    return AgenticWorkflow.stringifyDefinition(definition);
  }
}
