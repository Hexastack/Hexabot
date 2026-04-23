/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ButtonType,
  OutgoingMessageType,
  ContentOptions,
  contentOptionsSchema,
} from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ExecArgs } from '@/actions';
import { ActionService } from '@/actions/actions.service';
import { ContentTypeService } from '@/cms/services/content-type.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import {
  MessageAction,
  messageActionOutputSchema,
  messageActionSettingsSchema,
} from './message-action.base';

const listActionInputSchema = z
  .object({
    query: z.any().optional(),
  })
  .extend({
    content: contentOptionsSchema
      .omit({ limit: true })
      .default({
        display: 'list',
        buttons: [
          {
            title: 'Hexabot',
            type: ButtonType.web_url,
            url: 'http://hexabot.ai/',
          },
        ],
        fields: { title: '', subtitle: '', image_url: '' },
        contentType: '',
        top_element_style: 'compact',
      })
      .meta({ title: 'Content' }),
  });

type ListActionInput = z.infer<typeof listActionInputSchema>;

const baseListActionSettingsSchema = messageActionSettingsSchema
  .omit({ typing: true })
  .extend({
    skip: z.int().min(0).max(100).nonnegative().prefault(0).default(0),
    limit: z.number().min(1).max(100).default(2),
  });
const listActionSettingsSchema = baseListActionSettingsSchema.default(() => ({
  ...baseListActionSettingsSchema.parse({}),
  skip: 0,
  limit: 1,
}));
type ListActionSettings = z.infer<typeof listActionSettingsSchema>;

@Injectable()
export class SendListAction extends MessageAction<
  ListActionInput,
  ListActionSettings
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'send_list',
        description:
          'Fetches CMS content and sends it as a list or carousel, optionally waiting for the reply.',
        inputSchema: listActionInputSchema,
        outputSchema: messageActionOutputSchema,
        settingsSchema: listActionSettingsSchema,
      },
      actionService,
    );
  }

  protected resolveMessageOptions(input: ListActionInput) {
    const options = super.resolveMessageOptions(input) ?? {};

    return { ...options, content: input.content };
  }

  private async ensureContentType(
    contentTypeService: ContentTypeService,
    entity?: string,
  ) {
    if (!entity) {
      return;
    }

    const contentType = await contentTypeService.findOne(entity);

    if (!contentType) {
      throw new Error(`Content type with id "${entity}" not found`);
    }
  }

  async execute({
    input,
    context,
    settings,
  }: ExecArgs<
    ListActionInput,
    ConversationalWorkflowContext,
    ListActionSettings
  >) {
    const contentOptions = input.content;

    if (!contentOptions) {
      throw new Error('Content settings are required to send a list');
    }

    const prepared = await this.prepare(context);
    const { content: contentService, contentType } = context.services;

    if (!contentService || !contentType) {
      throw new Error('Content services are missing from the workflow context');
    }

    await this.ensureContentType(contentType, contentOptions.contentType);

    const skip = settings.skip ?? 0;
    const options: ContentOptions = {
      ...contentOptions,
      limit: settings.limit,
      query: input.query ?? contentOptions.query,
    };
    const { elements, pagination } = await contentService.getContent(
      options,
      skip,
    );
    const envelope = prepared.envelopeFactory.buildListEnvelope(
      contentOptions.display === OutgoingMessageType.carousel
        ? OutgoingMessageType.carousel
        : OutgoingMessageType.list,
      options,
      elements,
      pagination,
    );

    return this.sendPreparedMessage(context, prepared, envelope, input);
  }
}

export default SendListAction;
