import fs from 'fs';
import path from 'path';

import { Workflow, WorkflowEventEmitter } from '../src';
import { exampleActions } from './actions';
import { ExampleContext } from './context';

const workflowPath = path.join(__dirname, 'workflow.yml');

async function main() {
  const yamlSource = fs.readFileSync(workflowPath, 'utf8');
  const workflow = Workflow.fromYaml(yamlSource, exampleActions);

  const context = new ExampleContext({
    user_id: 'user-123',
    account_tier: 'pro',
    locale: 'en-US',
    timezone: 'America/Los_Angeles',
    channel: 'email',
  });

  const emitter = new WorkflowEventEmitter();
  emitter.on('step:start', ({ step }) => context.log(`step:start:${step.name}`));
  emitter.on('step:success', ({ step }) => context.log(`step:success:${step.name}`));
  emitter.on('workflow:finish', ({ output }) => context.log('workflow:finish', output));

  const runner = await workflow.buildAsyncRunner({ eventEmitter: emitter });

  const inputData = {
    query: 'We are seeing API errors after deploying billing changes.',
    user_email: 'customer@example.com',
    priority: 'normal',
    attachments: [],
  };

  const memory = {
    thread_id: 'thread-123',
    full_transcript: 'Conversation so far with the user.',
    last_summary: 'Previous summary of the issue.',
    support_playbook: 'Support runbook v1.2',
    product_brief: 'Launch messaging and positioning.',
  };

  const result = await runner.start({ inputData, context, memory });

  if (result.status === 'finished') {
    console.log('Final workflow outputs:', result.output);
    return;
  }

  if (result.status === 'suspended') {
    console.log(
      `Workflow suspended at step ${result.step.id} for reason "${result.reason}"`,
      result.data,
    );
    return;
  }

  console.error('Workflow failed:', result.error);
}

// pnpm dlx ts-node packages/agentic/example/workflow.ts
void main();
