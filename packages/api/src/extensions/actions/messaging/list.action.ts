/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { OutgoingMessageFormat } from '@/chat/types/message';
import { ContentOptions, contentOptionsSchema } from '@/chat/types/options';
import { ContentTypeService } from '@/cms/services/content-type.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import {
  MessageAction,
  MessageActionSettings,
  messageActionOutputSchema,
  messageActionSettingsSchema,
} from './message-action.base';

const listActionInputSchema = z.object({
  skip: z.number().int().nonnegative().default(0),
  query: z.any().optional(),
});

type ListActionInput = z.infer<typeof listActionInputSchema>;
type ListActionSettings = MessageActionSettings & {
  content: ContentOptions;
};

const listActionSettingsSchema = messageActionSettingsSchema.extend({
  content: contentOptionsSchema,
});

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

  protected resolveMessageOptions(settings: ListActionSettings) {
    const options = super.resolveMessageOptions(settings) ?? {};

    return { ...options, content: settings.content };
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
  }: ActionExecutionArgs<
    ListActionInput,
    ConversationalWorkflowContext,
    ListActionSettings
  >) {
    const contentOptions = settings.content;

    if (!contentOptions) {
      throw new Error('Content settings are required to send a list');
    }

    const prepared = await this.prepare(context);
    const { content: contentService, contentType } = context.services;

    if (!contentService || !contentType) {
      throw new Error('Content services are missing from the workflow context');
    }

    await this.ensureContentType(contentType, contentOptions.entity);

    const skip = input.skip ?? 0;
    const options: ContentOptions = {
      ...contentOptions,
      query: input.query ?? contentOptions.query,
    };
    const { elements, pagination } = await contentService.getContent(
      options,
      skip,
    );
    const envelope = prepared.envelopeFactory.buildListEnvelope(
      contentOptions.display === OutgoingMessageFormat.carousel
        ? OutgoingMessageFormat.carousel
        : OutgoingMessageFormat.list,
      options,
      elements,
      pagination,
    );

    return this.sendPreparedMessage(context, prepared, envelope, settings);
  }
}

export default SendListAction;
