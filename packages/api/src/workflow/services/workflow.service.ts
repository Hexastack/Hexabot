/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';
import {
  IOOutgoingSubscribeMessage,
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
  WorkflowTransformerDto,
} from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowRepository } from '../repositories/workflow.repository';

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
  ): Promise<IOOutgoingSubscribeMessage> {
    try {
      await this.gateway.joinNotificationSockets(req, Room.WORKFLOW);

      return res.status(200).json({
        success: true,
        subscribe: Room.WORKFLOW,
      });
    } catch (e) {
      this.logger.error('Websocket subscription', e);
      throw new InternalServerErrorException(e);
    }
  }
}
