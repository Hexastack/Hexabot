/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { createAction } from '@/actions/create-action';
import {
  SUBSCRIBER_HANDOVER_MODES,
  SubscriberHandoverMode,
} from '@/chat/services/subscriber.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';
import { WorkflowType } from '@/workflow/types';

const subscriberHandoverModeSchema = z.enum(SUBSCRIBER_HANDOVER_MODES);
const subscriberHandoverInputSchema = z
  .object({
    mode: subscriberHandoverModeSchema.default('auto').meta({
      title: 'Mode',
      description:
        'Handover mode: assign to a specific user or auto-pick the least-loaded online active user.',
    }),
    user_id: z
      .uuid()
      .optional()
      .meta({
        title: 'User ID',
        description: 'Required when mode is set to "specific".',
        'ui:widget': 'AutoCompleteWidget',
        'ui:options': {
          showWhen: {
            field: 'mode',
            equals: 'specific',
          },
          entity: 'User',
          valueKey: 'id',
          labelKey: 'username',
        },
      }),
  })
  .superRefine((input, ctx) => {
    if (input.mode === 'specific' && !input.user_id) {
      ctx.addIssue({
        code: 'custom',
        message: '`user_id` is required when mode is "specific"',
        path: ['user_id'],
      });
    }
  });
const subscriberHandoverOutputSchema = z.object({
  success: z.boolean(),
  mode: subscriberHandoverModeSchema,
  subscriber_id: z.uuid(),
  assigned_to: z.uuid().nullable(),
  reason: z.enum(['no_available_user']).optional(),
});

type SubscriberHandoverInput = z.infer<typeof subscriberHandoverInputSchema>;
type SubscriberHandoverOutput = z.infer<typeof subscriberHandoverOutputSchema>;

export const SubscriberHandoverAction = createAction<
  SubscriberHandoverInput,
  SubscriberHandoverOutput,
  ConversationalWorkflowContext
>({
  name: 'subscriber_handover',
  description:
    'Hands over a subscriber conversation to a human user (specific or auto least-loaded online active assignee).',
  group: 'subscriber',
  color: '#3CB0A4',
  icon: 'Headset',
  workflowTypes: [WorkflowType.conversational],
  inputSchema: subscriberHandoverInputSchema,
  outputSchema: subscriberHandoverOutputSchema,
  async execute({ input, context }) {
    if (!context.event) {
      throw new Error('Missing event on workflow context');
    }

    const subscriber = context.event.getInitiator();

    if (!subscriber) {
      throw new Error('Missing subscriber on event');
    }

    const mode = (input.mode ?? 'auto') as SubscriberHandoverMode;
    const result = await context.services.subscriber.handOverByPolicy(
      subscriber,
      {
        mode,
        userId: input.user_id,
      },
    );

    return {
      success: result.success,
      mode: result.mode,
      subscriber_id: result.subscriber.id,
      assigned_to: result.assignedTo,
      ...(result.reason ? { reason: result.reason } : {}),
    };
  },
});

export default SubscriberHandoverAction;
