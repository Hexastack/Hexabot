/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { BaseAction, ExecArgs } from '@/actions';
import { ActionService } from '@/actions/actions.service';
import { MailerService } from '@/mailer/mailer.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

const sendMailInputSchema = z.object({
  to: z.email().meta({
    title: 'To',
    description: 'Recipient email address.',
  }),
  title: z.string().min(1).meta({
    title: 'Title',
    description: 'Email subject.',
  }),
  content: z.string().min(1).meta({
    title: 'Content (HTML)',
    description: 'HTML email content.',
  }),
});
const sendMailOutputSchema = z.union([
  z.object({
    success: z.literal(true),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);
type SendMailInput = z.infer<typeof sendMailInputSchema>;
type SendMailOutput = z.infer<typeof sendMailOutputSchema>;

@Injectable()
export class SendMailAction extends BaseAction<
  SendMailInput,
  SendMailOutput,
  WorkflowRuntimeContext
> {
  constructor(
    actionService: ActionService,
    private readonly mailerService: MailerService,
  ) {
    super(
      {
        name: 'send_mail',
        description: 'Sends an email using HTML content.',
        group: 'web',
        icon: 'Mail',
        color: '#68b1ff',
        inputSchema: sendMailInputSchema,
        outputSchema: sendMailOutputSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
  }: ExecArgs<SendMailInput, WorkflowRuntimeContext>) {
    try {
      await this.mailerService.sendMail({
        to: input.to,
        subject: input.title,
        html: input.content,
      });

      return { success: true } satisfies SendMailOutput;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not send email';
      context.services.logger.error('send_mail action failed', message, '', {
        to: input.to,
      });

      return { success: false, error: message } satisfies SendMailOutput;
    }
  }
}

export default SendMailAction;
