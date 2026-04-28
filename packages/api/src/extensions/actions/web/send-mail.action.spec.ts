/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionService } from '@/actions/actions.service';
import { MailerService } from '@/mailer/mailer.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { SendMailAction } from './send-mail.action';

describe('SendMailAction', () => {
  let actionService: ActionService;
  let mailerService: { sendMail: jest.Mock };
  let context: WorkflowRuntimeContext;

  beforeEach(() => {
    actionService = { register: jest.fn() } as unknown as ActionService;
    mailerService = { sendMail: jest.fn() };
    context = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    } as unknown as WorkflowRuntimeContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('sends email and returns success', async () => {
    const action = new SendMailAction(
      actionService,
      mailerService as unknown as MailerService,
    );
    const result = await action.execute({
      input: {
        to: 'a@b.com',
        title: 'Hello',
        content: '<p>Hi</p>',
      },
      context,
      settings: {},
      bindings: {},
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'a@b.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });
    expect(result).toEqual({ success: true });
  });

  it('returns failure result and logs when mail send throws', async () => {
    const action = new SendMailAction(
      actionService,
      mailerService as unknown as MailerService,
    );
    const loggerError = jest.fn();

    context = {
      services: {
        logger: {
          error: loggerError,
        },
      },
    } as unknown as WorkflowRuntimeContext;

    mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP down'));

    const result = await action.execute({
      input: {
        to: 'a@b.com',
        title: 'Hello',
        content: '<p>Hi</p>',
      },
      context,
      settings: {},
      bindings: {},
    });

    expect(result).toEqual({ success: false, error: 'SMTP down' });
    expect(loggerError).toHaveBeenCalledWith(
      'send_mail action failed',
      'SMTP down',
      '',
      { to: 'a@b.com' },
    );
  });
});
