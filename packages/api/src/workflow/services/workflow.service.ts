/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowEventMap } from '@hexabot-ai/agentic';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { HookEventKey, OnEvent } from '@nestjs/event-emitter';

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
  WorkflowCreateDto,
  Workflow as WorkflowDto,
  WorkflowDtoConfig,
  WorkflowTransformerDto,
} from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowType } from '../types';

import { WorkflowRunService } from './workflow-run.service';

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
  ) {
    super(repository);
  }

  /**
   * Pick the most recently created workflow if one exists.
   */
  async pickWorkflow(): Promise<WorkflowDto | null> {
    const [latest] = await this.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });

    return latest ?? null;
  }

  async create(payload: WorkflowCreateDto) {
    if (!payload.definition) {
      throw new BadRequestException('Workflow definition is required');
    }

    return super.create(payload);
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
}
