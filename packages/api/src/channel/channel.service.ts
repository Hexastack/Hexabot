/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { SubscriberService } from '@/chat/services/subscriber.service';
import { CONSOLE_CHANNEL_NAME } from '@/extensions/channels/console/console-channel.settings';
import { WEB_CHANNEL_NAME } from '@/extensions/channels/web/web-channel.settings';
import { LoggerService } from '@/logger/logger.service';
import {
  SocketGet,
  SocketPost,
} from '@/websocket/decorators/socket-method.decorator';
import { SocketReq } from '@/websocket/decorators/socket-req.decorator';
import { SocketRes } from '@/websocket/decorators/socket-res.decorator';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WorkflowService } from '@/workflow/services/workflow.service';

import ChannelHandler from './lib/Handler';
import { ChannelName } from './types';

@Injectable()
export class ChannelService {
  private registry: Map<string, ChannelHandler<ChannelName>> = new Map();

  constructor(
    private readonly logger: LoggerService,
    private readonly subscriberService: SubscriberService,
    private readonly workflowService: WorkflowService,
  ) {}

  /**
   * Registers a channel with a specific handler.
   *
   * @param name - The name of the channel to be registered.
   * @param channel - The channel handler associated with the channel name.
   * @typeParam C The channel handler's type that extends `ChannelHandler`.
   */
  public setChannel<T extends ChannelName, C extends ChannelHandler<T>>(
    name: T,
    channel: C,
  ) {
    this.registry.set(name, channel);
  }

  /**
   * Retrieves all registered channel handlers.
   *
   * @returns An array of all channel handlers currently registered.
   */
  public getAll() {
    return Array.from(this.registry.values());
  }

  /**
   * Finds and returns the channel handler associated with the specified channel name.
   *
   * @param name - The name of the channel to find.
   * @returns The channel handler associated with the specified name, or undefined if the channel is not found.
   */
  public findChannel(name: ChannelName) {
    return this.getAll().find((c) => {
      return c.getName() === name;
    });
  }

  /**
   * Retrieves the appropriate channel handler based on the channel name.
   *
   * @param channelName - The name of the channel (messenger, web, ...).
   * @returns The handler for the specified channel.
   */
  public getChannelHandler<T extends ChannelName, C extends ChannelHandler<T>>(
    name: T,
  ): C {
    const handler = this.registry.get(name);
    if (!handler) {
      throw new Error(`Channel ${name} not found`);
    }

    return handler as C;
  }

  /**
   * Handles a request for a specific channel.
   *
   * @param channel - The channel for which the request is being handled.
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   * @param workflowId - Optional workflow identifier to target execution.
   * @returns A promise that resolves when the handler has processed the request.
   */
  async handle(
    channel: string,
    req: Request,
    res: Response,
    workflowId?: string,
  ): Promise<void> {
    const handler = this.getChannelHandler(channel);
    handler.handle(req, res, workflowId);
  }

  /**
   * Handles a websocket request for the web channel.
   *
   * @param req - The websocket request object.
   * @param res - The websocket response object.
   */
  @SocketGet(`/webhook/${WEB_CHANNEL_NAME}/`)
  @SocketPost(`/webhook/${WEB_CHANNEL_NAME}/`)
  async handleWebsocketForWebChannel(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ) {
    this.logger.log('Channel notification (Web Socket) : ', req.method);
    const handler = this.getChannelHandler(WEB_CHANNEL_NAME);
    const workflowId = await this.getValidatedWorkflowId(req);

    return await handler.handle(req, res, workflowId);
  }

  /**
   * Handles a websocket request for the admin chat console channel.
   * It considers the user as a subscriber.
   *
   * @param req - The websocket request object.
   * @param res - The websocket response object.
   */
  @SocketGet(`/webhook/${CONSOLE_CHANNEL_NAME}/`)
  @SocketPost(`/webhook/${CONSOLE_CHANNEL_NAME}/`)
  async handleWebsocketForAdminChatConsole(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ) {
    this.logger.log(
      'Channel notification (Admin Chat Console Socket) : ',
      req.method,
    );

    if (!req.session.passport?.user?.id) {
      setTimeout(() => {
        req.socket.client.conn.close();
      }, 300);
      throw new UnauthorizedException(
        'Only authenticated users are allowed to use this channel',
      );
    }

    if (!req.session.web?.profile?.id) {
      const profile = await this.subscriberService.updateOne(
        req.session.passport.user.id,
        {
          channel: {
            name: CONSOLE_CHANNEL_NAME,
            data: { isSocket: true },
          },
          lastvisit: new Date(),
          retainedFrom: new Date(),
          foreignId: req.session.passport.user.id,
        },
      );

      // Update session (end user is both a user + subscriber)
      req.session.web = {
        profile,
        isSocket: true,
        messageQueue: [],
        polling: false,
      };
    }

    const handler = this.getChannelHandler(CONSOLE_CHANNEL_NAME);
    const workflowId = await this.getValidatedWorkflowId(req);

    return await handler.handle(req, res, workflowId);
  }

  private getWorkflowIdFromSocketQuery(req: SocketRequest): string | undefined {
    const rawWorkflowId = req.query.workflow_id;
    const workflowId = Array.isArray(rawWorkflowId)
      ? rawWorkflowId[0]
      : rawWorkflowId;

    if (typeof workflowId !== 'string') {
      return undefined;
    }

    const normalizedWorkflowId = workflowId.trim();

    return normalizedWorkflowId.length > 0 ? normalizedWorkflowId : undefined;
  }

  private async getValidatedWorkflowId(
    req: SocketRequest,
  ): Promise<string | undefined> {
    const workflowId = this.getWorkflowIdFromSocketQuery(req);

    if (!workflowId) {
      return undefined;
    }

    const workflow = await this.workflowService.findOne(workflowId);

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
    }

    return workflowId;
  }
}
