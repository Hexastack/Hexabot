/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionService } from '@/actions/actions.service';
import { OutgoingMessageFormat } from '@/chat/types/message';
import { WorkflowContext } from '@/workflow/services/workflow-context';

import { AwaitReplyAction } from './await-reply.action';

describe('AwaitReplyAction', () => {
  let actionService: ActionService;
  let action: AwaitReplyAction;
  let workflow: { suspend: jest.Mock };
  let context: WorkflowContext;
  let event: {
    getHandler: jest.Mock;
    getSender: jest.Mock;
  };

  beforeEach(() => {
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new AwaitReplyAction(actionService);
    workflow = { suspend: jest.fn() };
    event = {
      getHandler: jest.fn(() => ({ getName: () => 'web' })),
      getSender: jest.fn(() => ({ id: 'sub-event' })),
    };
    context = {
      workflow,
      event,
      subscriberId: 'sub-ctx',
      workflowRunId: 'run-ctx',
    } as unknown as WorkflowContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('suspends the workflow and returns the parsed reply message', async () => {
    const envelope = {
      format: OutgoingMessageFormat.text as const,
      message: { text: 'hello' },
    };
    const input = {
      action: 'send_text_message',
      channel: 'web',
      recipient: 'sub-1',
      workflowRunId: 'run-1',
      messageId: 'mid-1',
      format: OutgoingMessageFormat.text,
      envelope,
    };
    const resume = { message: { text: 'user reply' } };
    workflow.suspend.mockResolvedValue(resume);

    const result = await action.execute({
      input,
      context,
      settings: action.parseSettings({}),
    });

    expect(workflow.suspend).toHaveBeenCalledWith({
      reason: 'awaiting_user_response',
      data: input,
    });
    expect(result).toEqual(resume.message);
  });

  it('throws when resume data does not include a valid message payload', async () => {
    workflow.suspend.mockResolvedValue({ unexpected: true });

    await expect(
      action.execute({
        input: {
          action: 'send_text_message',
          channel: 'web',
          recipient: 'sub-1',
          format: OutgoingMessageFormat.text,
          envelope: {
            format: OutgoingMessageFormat.text as const,
            message: { text: 'hello' },
          },
        },
        context,
        settings: action.parseSettings({}),
      }),
    ).rejects.toThrow('resumeData must include a message payload');
  });

  it('auto-fills missing suspension payload fields from context/event', async () => {
    const resume = { message: { text: 'user reply' } };
    workflow.suspend.mockResolvedValue(resume);

    const result = await action.execute({
      input: {},
      context,
      settings: action.parseSettings({}),
    });

    expect(workflow.suspend).toHaveBeenCalledWith({
      reason: 'awaiting_user_response',
      data: {
        action: 'await_reply',
        channel: 'web',
        recipient: 'sub-ctx',
        workflowRunId: 'run-ctx',
        messageId: undefined,
        format: undefined,
        envelope: undefined,
      },
    });
    expect(result).toEqual(resume.message);
  });
});
