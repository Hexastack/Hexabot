/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import { AwaitReplyAction } from './await-reply.action';

describe('AwaitReplyAction', () => {
  let actionService: ActionService;
  let action: AwaitReplyAction;
  let workflow: { suspend: jest.Mock };
  let context: ConversationalWorkflowContext;
  let event: {
    getHandler: jest.Mock;
    getInitiator: jest.Mock;
  };

  beforeEach(() => {
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new AwaitReplyAction(actionService);
    workflow = { suspend: jest.fn() };
    event = {
      getHandler: jest.fn(() => ({ getName: () => 'web' })),
      getInitiator: jest.fn(() => ({ id: 'sub-event' })),
    };
    context = {
      workflow,
      event,
      initiatorId: 'sub-ctx',
      workflowRunId: 'run-ctx',
    } as unknown as ConversationalWorkflowContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('suspends the workflow and returns parsed conversational input', async () => {
    const resume = {
      message: { type: 'message', data: { text: 'user reply' } },
      text: 'user reply',
      thread_id: 'thread-1',
    };
    workflow.suspend.mockResolvedValue(resume);

    const result = await action.execute({
      input: undefined,
      context,
      settings: action.parseSettings({}),
      bindings: {} as any,
    });

    expect(workflow.suspend).toHaveBeenCalledWith({
      reason: 'awaiting_user_response',
      data: null,
    });
    expect(result).toEqual(resume);
  });

  it('throws when resume data is not compliant with conversational input schema', async () => {
    workflow.suspend.mockResolvedValue({ unexpected: true });

    await expect(
      action.execute({
        input: undefined,
        context,
        settings: action.parseSettings({}),
        bindings: {} as any,
      }),
    ).rejects.toThrow(
      'resumeData must be compliant with the workflow input schema (conversational)',
    );
  });

  it('accepts optional conversational fields in resume data', async () => {
    const resumeWithOptionalFields = {
      message: { type: 'message', data: { text: 'user reply' } },
      text: 'user reply',
      message_type: 'message',
      payload: 'quick-reply',
      mid: 'mid-1',
      thread_id: 'thread-1',
    };
    workflow.suspend.mockResolvedValue(resumeWithOptionalFields);

    const resultWithOptionalFields = await action.execute({
      input: undefined,
      context,
      settings: action.parseSettings({}),
      bindings: {} as any,
    });

    expect(resultWithOptionalFields).toEqual(resumeWithOptionalFields);
  });
});
