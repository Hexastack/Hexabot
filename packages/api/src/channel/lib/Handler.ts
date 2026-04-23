/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject, Injectable, OnModuleInit, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request, Response } from 'express';
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
import { AttachmentRef } from '@/chat/types/attachment';
import {
  StdOutgoingEnvelope,
  StdOutgoingMessageEnvelope,
} from '@/chat/types/message';
import type { ActionOptions } from '@/chat/types/options';
import { SettingService } from '@/setting/services/setting.service';
import { Extension } from '@/utils/generics/extension';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';

import { ChannelService } from '../channel.service';
import { ChannelAttachmentService } from '../services/channel-attachment.service';
import { ChannelName } from '../types';

import {
  ChannelCapabilities,
  DEFAULT_CHANNEL_CAPABILITIES,
} from './channel-capabilities';
import { ChannelEventBus } from './channel-event-bus';
import { collectExtensionInjectMeta } from './extension-inject.decorator';
import { UnsupportedOutgoingFormatError } from './outbound';

@Injectable()
export default abstract class ChannelHandler<
    N extends ChannelName = ChannelName,
  >
  extends Extension
  implements OnModuleInit
{
  @Inject(AttachmentService)
  public readonly attachmentService: AttachmentService;

  @Inject(ChannelAttachmentService)
  protected readonly channelAttachmentService: ChannelAttachmentService;

  @Inject(SettingService)
  protected readonly settingService: SettingService;

  @Inject(ChannelService)
  protected readonly channelService: ChannelService;

  @Inject(ChannelEventBus)
  protected readonly channelEventBus: ChannelEventBus;

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

    const metas = collectExtensionInjectMeta(this);
    await Promise.all(
      metas.map(async ({ propertyKey, factory }) => {
        (this as any)[propertyKey] = await this.createModuleRef(
          factory(this.getName()),
        );
      }),
    );
  }

  protected async createModuleRef<T>(provider: Type<T>): Promise<T> {
    return await this.moduleRef.create(provider);
  }

  /**
   * Returns the capabilities this channel supports.
   *
   * Defaults to all formats enabled with no text length limit. Override in
   * concrete channel handlers to declare which envelope formats and transport
   * features the platform actually supports.
   */
  getCapabilities(): ChannelCapabilities {
    return DEFAULT_CHANNEL_CAPABILITIES;
  }

  /**
   * Throws when the envelope's format is not supported by this channel.
   * The `system` format always throws — it is internal and must never reach
   * the transport layer.
   */
  private assertCapability(envelope: StdOutgoingEnvelope): void {
    const caps = this.getCapabilities();
    // caps[system] is undefined (not in ChannelCapabilities) → always throws
    if (!caps[envelope.format as keyof ChannelCapabilities]) {
      throw new UnsupportedOutgoingFormatError(envelope.format);
    }
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
   * Send a channel message to the end user.
   *
   * Guards the capability contract before delegating to `doSendMessage`.
   * Throws `UnsupportedOutgoingFormatError` when the envelope format is not
   * supported by this channel (including the internal `system` format).
   */
  async sendMessage(
    event: MessageInboundEvent<N>,
    envelope: StdOutgoingEnvelope,
    options: ActionOptions,
  ): Promise<{ mid: string }> {
    this.assertCapability(envelope);

    return this.doSendMessage(
      event,
      envelope as StdOutgoingMessageEnvelope,
      options,
    );
  }

  /**
   * Channel-specific send implementation. Called by `sendMessage` after the
   * capability guard passes. The `system` format is never passed here.
   */
  protected abstract doSendMessage(
    event: MessageInboundEvent<N>,
    envelope: StdOutgoingMessageEnvelope,
    options: ActionOptions,
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

  /**
   * Returns a publicly accessible URL for an attachment.
   *
   * Default: generates a signed Hexabot download URL
   * (`/webhook/:channel/download/:name?t=<jwt>`).
   *
   * Override in HTTP-based channels (Facebook, WhatsApp, …) when the
   * messaging platform fetches the URL itself and the JWT-signed scheme
   * would not be appropriate (e.g. upload the file to the platform's media
   * API once and return the resulting permanent media URL instead).
   */
  public async getAttachmentPublicUrl(
    attachment: AttachmentRef,
  ): Promise<string> {
    return this.channelAttachmentService.getPublicUrl(
      this.getName(),
      attachment,
    );
  }
}
