/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject, Injectable, OnModuleInit, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NextFunction, Request, Response } from 'express';
import mime from 'mime';
import { v4 as uuidv4 } from 'uuid';

import { Attachment } from '@/attachment/dto/attachment.dto';
import { AttachmentService } from '@/attachment/services/attachment.service';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentFile,
  AttachmentResourceRef,
} from '@/attachment/types';
import { MessageInboundEvent } from '@/channel/lib/inbound-events';
import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { StdOutgoingEnvelope } from '@/chat/types/message';
import { I18nService } from '@/i18n';
import { SettingService } from '@/setting/services/setting.service';
import { Extension } from '@/utils/generics/extension';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';

import { ChannelService } from '../channel.service';
import { ChannelName } from '../types';

@Injectable()
export default abstract class ChannelHandler<
    N extends ChannelName = ChannelName,
  >
  extends Extension
  implements OnModuleInit
{
  @Inject(I18nService)
  protected readonly i18n: I18nService;

  @Inject(EventEmitter2)
  protected readonly eventEmitter: EventEmitter2;

  @Inject(AttachmentService)
  public readonly attachmentService: AttachmentService;

  @Inject(SettingService)
  protected readonly settingService: SettingService;

  @Inject(ChannelService)
  protected readonly channelService: ChannelService;

  @Inject(ModuleRef)
  private readonly moduleRef: ModuleRef;

  constructor(name: N) {
    super(name);
  }

  getName() {
    return this.name as N;
  }

  async onModuleInit() {
    await super.onModuleInit();
    this.channelService.setChannel(
      this.getName(),
      this as unknown as ChannelHandler<N>,
    );
  }

  protected async createModuleRef<T>(provider: Type<T>): Promise<T> {
    return await this.moduleRef.create(provider);
  }

  /**
   * Returns the channel's settings
   * @returns Channel's settings
   */
  async getSettings<S extends string = N>() {
    const settings = await this.settingService.getSettings();

    // @ts-expect-error workaround typing
    return settings[this.getName() as keyof Settings] as Settings[S];
  }

  /**
   * Process incoming channel data via POST/GET methods
   *
   * @param {module:Controller.req} req
   * @param {module:Controller.res} res
   */
  abstract handle(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
    workflowId?: string,
  ): any;

  /**
   * Send a channel Message to the end user
   * @param event - Incoming event/message being responded to
   * @param envelope - The message to be sent {format, message}
   * @param options - Might contain additional settings
   * @returns {Promise} - The channel's response, otherwise an error
   
   */
  abstract sendMessage(
    event: MessageInboundEvent<N>,
    envelope: StdOutgoingEnvelope,
    options: any,
  ): Promise<{ mid: string }>;

  /**
   * Calls the channel handler to fetch attachments and stores them
   *
   * @param event
   * @returns An attachment array
   */
  getMessageAttachments?(
    event: MessageInboundEvent<N>,
  ): Promise<AttachmentFile[]>;

  /**
   * Fetch the subscriber profile data
   * @param event - The message event received
   * @returns {Promise<Subscriber>} - The channel's response, otherwise an error
   */
  getSubscriberAvatar?(
    event: MessageInboundEvent<N>,
  ): Promise<AttachmentFile | undefined>;

  /**
   * Fetch the subscriber profile data
   *
   * @deprecated
   * @param event - The message event received
   * @returns {Promise<Subscriber>} - The channel's response, otherwise an error
   */
  async getUserData(
    event: MessageInboundEvent<N>,
  ): Promise<SubscriberCreateDto> {
    return await this.getSubscriberData(event);
  }

  /**
   * Fetch the subscriber profile data
   *
   * @param event - The message event received
   * @returns {Promise<Subscriber>} - The channel's response, otherwise an error
   */
  abstract getSubscriberData(
    event: MessageInboundEvent<N>,
  ): Promise<SubscriberCreateDto>;

  /**
   * Persist Message attachments
   *
   * @returns Resolves the promise once attachments are fetched and stored
   */
  async persistMessageAttachments(
    event: MessageInboundEvent<N> & {
      setPersistedAttachments(attachments: Attachment[]): void;
    },
  ) {
    if (!this.getMessageAttachments) {
      return;
    }

    const metadatas = await this.getMessageAttachments(event);
    const subscriber = event.getInitiator();
    const attachments = await Promise.all(
      metadatas.map(({ file, name, type, size }) => {
        return this.attachmentService.store(file, {
          name: `${name ? `${name}-` : ''}${uuidv4()}.${mime.extension(type)}`,
          type,
          size,
          resourceRef: AttachmentResourceRef.MessageAttachment,
          access: AttachmentAccess.Private,
          createdByRef: AttachmentCreatedByRef.Subscriber,
          createdBy: subscriber.id,
        });
      }),
    );

    event.setPersistedAttachments(attachments);
  }

  /**
   * Custom channel middleware
   * @param req
   * @param res
   * @param next
   */
  async middleware(
    _req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<unknown> {
    // Do nothing, override in channel
    return next();
  }

  /**
   * Checks if the request is authorized to download a given attachment file.
   * Can be overriden by the channel handler to customize, by default it shouldn't
   * allow any client to download a subscriber attachment for example.
   *
   * @param attachment The attachment object
   * @param req - The HTTP express request object.
   * @return True, if requester is authorized to download the attachment
   */
  public async hasDownloadAccess(attachment: Attachment, _req: Request) {
    return attachment.access === AttachmentAccess.Public;
  }
}
