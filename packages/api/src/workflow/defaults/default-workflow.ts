/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';

/**
 * Minimal fallback workflow used when no custom workflows are configured.
 * It leverages the messaging actions to acknowledge the subscriber and suspend
 * until the next incoming message resumes the run.
 */
export const defaultWorkflowDefinition: WorkflowDefinition = {
  workflow: {
    name: 'default_messaging_workflow',
    version: '0.1.0',
    description:
      'Fallback workflow that echoes the subscriber message using messaging actions.',
  },
  tasks: {
    send_default_reply: {
      action: 'send_text_message',
      description: 'Send a basic acknowledgment using messaging actions.',
      inputs: {
        text: '="Thanks for reaching out! You said: " & ($input.message.text ? $input.message.text : "[no text]")',
      },
    },
  },
  flow: [{ do: 'send_default_reply' }],
  outputs: {
    last_message_text:
      '=$exists($output.send_default_reply.text) ? $output.send_default_reply.text : ""',
  },
};

export default defaultWorkflowDefinition;
