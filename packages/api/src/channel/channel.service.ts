/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Source } from '@hexabot-ai/types';
import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { SubscriberService } from '@/chat/services/subscriber.service';
import { CONSOLE_CHANNEL_NAME } from '@/extensions/channels/console/settings.schema';
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

import type ChannelHandler from './lib/Handler';
import { ChannelRegistry } from './services/channel-registry.service';
import { SourceService } from './services/source.service';
import { ChannelName } from './types';

@Injectable()
export class ChannelService implements OnApplicationBootstrap {
  constructor(
    private readonly logger: LoggerService,
    private readonly subscriberService: SubscriberService,
    private readonly sourceService: SourceService,
    private readonly channelRegistry: ChannelRegistry,
    private readonly workflowService: WorkflowService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.sourceService.ensureDefaultSources(
      this.getAll().map((handler) => handler.getName()),
    );
  }

  public setChannel<T extends ChannelName, C extends ChannelHandler<T>>(
    name: T,
    channel: C,
  ) {
    this.channelRegistry.setChannel(name, channel);
  }

  public getAll() {
    return this.channelRegistry.getAll();
  }

  public findChannel(name: ChannelName) {
    return this.channelRegistry.findChannel(name);
  }

  public getChannelHandler<T extends ChannelName, C extends ChannelHandler<T>>(
    name: T,
  ): C {
    return this.channelRegistry.getChannelHandler(name);
  }

  private async resolveExplicitWorkflowId(
    workflowId?: string,
  ): Promise<string | undefined> {
    if (!workflowId) {
      return undefined;
    }

    const workflow = await this.workflowService.findOne(workflowId);

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
    }

    return workflowId;
  }

  private async resolveWorkflowIdForSource(
    source: Source,
    explicitWorkflowId?: string,
  ): Promise<string | undefined> {
    const validatedExplicitWorkflowId =
      await this.resolveExplicitWorkflowId(explicitWorkflowId);

    if (validatedExplicitWorkflowId) {
      return validatedExplicitWorkflowId;
    }

    return source.defaultWorkflow ?? undefined;
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

  private getSourceRefFromSocketPath(req: SocketRequest): string {
    const sourceRef = req.params?.sourceRef;

    if (typeof sourceRef !== 'string' || sourceRef.trim().length === 0) {
      throw new NotFoundException('Source reference is required');
    }

    return sourceRef.trim();
  }

  private async ensureConsoleSession(req: SocketRequest, source: Source) {
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
            name: source.channel,
            data: { isSocket: true },
          },
          source: source.id,
          lastvisit: new Date(),
          retainedFrom: new Date(),
          foreignId: req.session.passport.user.id,
        },
      );

      req.session.web = {
        profile,
        sourceId: source.id,
      };

      return;
    }

    req.session.web = {
      ...req.session.web,
      sourceId: source.id,
    };
  }

  async handle(
    sourceRef: string,
    req: Request,
    res: Response,
    workflowId?: string,
  ): Promise<void> {
    const source = await this.sourceService.findActiveByRef(sourceRef);
    const handler = this.getChannelHandler(source.channel);
    const resolvedWorkflowId = await this.resolveWorkflowIdForSource(
      source,
      workflowId,
    );

    await handler.handle(req, res, source, resolvedWorkflowId);
  }

  @SocketGet('/webhook/:sourceRef')
  @SocketPost('/webhook/:sourceRef')
  async handleWebsocketForSource(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ) {
    this.logger.log('Channel notification (Web Socket) : ', req.method);

    const sourceRef = this.getSourceRefFromSocketPath(req);
    const source = await this.sourceService.findActiveByRef(sourceRef);

    if (source.channel === CONSOLE_CHANNEL_NAME) {
      await this.ensureConsoleSession(req, source);
    }

    const handler = this.getChannelHandler(source.channel);
    const explicitWorkflowId = this.getWorkflowIdFromSocketQuery(req);
    const resolvedWorkflowId = await this.resolveWorkflowIdForSource(
      source,
      explicitWorkflowId,
    );

    return await handler.handle(req, res, source, resolvedWorkflowId);
  }
}
