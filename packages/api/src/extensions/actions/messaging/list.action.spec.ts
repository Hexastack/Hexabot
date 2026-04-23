/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { OutgoingMessageType, ContentOptions } from '@hexabot-ai/types';

import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import { SendListAction } from './list.action';
import { MessageActionSettings } from './message-action.base';

describe('SendListAction', () => {
  let actionService: ActionService;
  let action: SendListAction;
  let contentService: { getContent: jest.Mock };
  let contentTypeService: { findOne: jest.Mock };
  let context: ConversationalWorkflowContext;

  const baseContentOptions: ContentOptions = {
    display: 'list',
    fields: {
      title: 'title',
      subtitle: 'subtitle',
      image_url: 'image',
    },
    buttons: [],
    limit: 2,
  };

  beforeEach(() => {
    actionService = { register: jest.fn() } as unknown as ActionService;
    contentService = {
      getContent: jest.fn(),
    };
    contentTypeService = {
      findOne: jest.fn().mockResolvedValue({ id: 'ct-id' }),
    };
    context = {
      services: {
        content: contentService,
        contentType: contentTypeService,
      },
    } as unknown as ConversationalWorkflowContext;
    action = new SendListAction(actionService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('fetches content and delegates sending the list envelope', async () => {
    const envelope = {
      type: OutgoingMessageType.list,
      data: {
        options: {},
        elements: [],
        pagination: { total: 1, skip: 1, limit: 2 },
      },
    };
    const prepared = {
      envelopeFactory: {
        buildListEnvelope: jest.fn(() => envelope),
      },
    } as any;
    const contentResult = {
      elements: [{ id: '42', title: 'Hello' }],
      pagination: { total: 1, skip: 1, limit: 2 },
    };
    const prepareSpy = jest
      .spyOn(action as any, 'prepare')
      .mockResolvedValue(prepared);
    const sendSpy = jest
      .spyOn(action as any, 'sendPreparedMessage')
      .mockResolvedValue('sent');
    contentService.getContent.mockResolvedValue(contentResult);

    const settings = {
      skip: 1,
      limit: 2,
    } as unknown as MessageActionSettings & {
      content: ContentOptions;
      skip: number;
      limit: number;
    };
    const input = {
      content: { ...baseContentOptions, contentType: 'ct-id' },
      query: { status: true },
    };
    const result = await action.execute({ input, context, settings } as any);

    expect(prepareSpy).toHaveBeenCalledWith(context);
    expect(contentTypeService.findOne).toHaveBeenCalledWith('ct-id');
    expect(contentService.getContent).toHaveBeenCalledWith(
      { ...baseContentOptions, contentType: 'ct-id', query: { status: true } },
      1,
    );
    expect(prepared.envelopeFactory.buildListEnvelope).toHaveBeenCalledWith(
      OutgoingMessageType.list,
      { ...baseContentOptions, contentType: 'ct-id', query: { status: true } },
      contentResult.elements,
      contentResult.pagination,
    );
    expect(sendSpy).toHaveBeenCalledWith(context, prepared, envelope, input);
    expect(result).toBe('sent');
  });

  it('throws when content settings are missing', async () => {
    await expect(
      action.execute({
        input: { skip: 0 } as any,
        context,
        settings: {} as MessageActionSettings,
      } as any),
    ).rejects.toThrow('Content settings are required to send a list');
  });

  it('throws when the content type does not exist', async () => {
    contentTypeService.findOne.mockResolvedValue(undefined);
    jest
      .spyOn(action as any, 'prepare')
      .mockResolvedValue({ envelopeFactory: { buildListEnvelope: jest.fn() } });

    await expect(
      action.execute({
        input: {
          content: { ...baseContentOptions, contentType: 'missing' },
        } as any,
        context,
        settings: { skip: 0 } as any,
        bindings: {} as any,
      }),
    ).rejects.toThrow('Content type with id "missing" not found');
  });
});
