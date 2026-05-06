/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { createAction } from '@/actions/create-action';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';
import { workflowResourceRef } from '@/workflow/resource-refs';
import { WorkflowType } from '@/workflow/types';

const subscriberUpdateLabelsInputSchema = z
  .object({
    labels_to_assign: z
      .array(z.uuid())
      .optional()
      .meta({
        title: 'Labels to assign',
        description: 'Label IDs to assign to the current subscriber.',
        'ui:widget': 'AutoCompleteWidget',
        'ui:options': {
          entity: 'Label',
          valueKey: 'id',
          labelKey: 'title',
        },
        ...workflowResourceRef('label'),
      }),
    labels_to_remove: z
      .array(z.uuid())
      .optional()
      .meta({
        title: 'Labels to remove',
        description: 'Label IDs to remove from the current subscriber.',
        'ui:widget': 'AutoCompleteWidget',
        'ui:options': {
          entity: 'Label',
          valueKey: 'id',
          labelKey: 'title',
        },
        ...workflowResourceRef('label'),
      }),
  })
  .superRefine((input, ctx) => {
    if (!input.labels_to_assign?.length && !input.labels_to_remove?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one label operation is required',
        path: ['labels_to_assign'],
      });
    }
  });
const subscriberUpdateLabelsOutputSchema = z.object({
  success: z.boolean(),
  subscriber_id: z.uuid(),
  labels: z.array(z.uuid()),
});

type SubscriberUpdateLabelsInput = z.infer<
  typeof subscriberUpdateLabelsInputSchema
>;
type SubscriberUpdateLabelsOutput = z.infer<
  typeof subscriberUpdateLabelsOutputSchema
>;

export const SubscriberUpdateLabelsAction = createAction<
  SubscriberUpdateLabelsInput,
  SubscriberUpdateLabelsOutput,
  ConversationalWorkflowContext
>({
  name: 'subscriber_update_labels',
  description:
    'Assigns and/or removes labels from the current subscriber in a single operation.',
  group: 'subscriber',
  color: '#3CB0A4',
  icon: 'Tag',
  workflowTypes: [WorkflowType.conversational],
  inputSchema: subscriberUpdateLabelsInputSchema,
  outputSchema: subscriberUpdateLabelsOutputSchema,
  async execute({ input, context }) {
    if (!context.event) {
      throw new Error('Missing event on workflow context');
    }

    const subscriber = context.event.getInitiator();

    if (!subscriber) {
      throw new Error('Missing subscriber on event');
    }

    const updatedSubscriber = await context.services.subscriber.updateLabels(
      subscriber,
      input.labels_to_assign,
      input.labels_to_remove,
    );
    context.event.setInitiator(updatedSubscriber);
    await context.syncInitiatorState();

    return {
      success: true,
      subscriber_id: updatedSubscriber.id,
      labels: updatedSubscriber.labels,
    };
  },
});

export default SubscriberUpdateLabelsAction;
