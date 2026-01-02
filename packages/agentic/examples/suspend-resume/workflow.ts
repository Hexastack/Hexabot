/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';

import { Workflow, WorkflowEventEmitter } from '../../src';

import { suspendResumeActions } from './actions';
import { SuspendResumeContext } from './context';

const workflowPath = path.join(__dirname, 'workflow.yml');

async function main() {
  const yamlSource = fs.readFileSync(workflowPath, 'utf8');
  const workflow = Workflow.fromYaml(yamlSource, {
    actions: suspendResumeActions,
  });
  const emitter = new WorkflowEventEmitter();
  const context = new SuspendResumeContext({ channel: 'chat' }, emitter);

  emitter.on('hook:workflow:start', () => context.log('workflow started'));
  emitter.on('hook:workflow:suspended', ({ step, reason, data }) =>
    context.log(`workflow suspended at "${step.name}"`, { reason, data }),
  );
  emitter.on('hook:workflow:finish', ({ output }) =>
    context.log('workflow finished', output),
  );

  const runner = await workflow.buildAsyncRunner();
  const startResult = await runner.start({
    inputData: {
      question: "Can we deploy to production after today's smoke tests?",
    },
    context,
  });

  if (startResult.status === 'finished') {
    context.log('finished without suspending', startResult.output);

    return;
  }

  if (startResult.status === 'failed') {
    console.error('Workflow failed', startResult.error);

    return;
  }

  context.log('persist this snapshot to resume later', startResult.snapshot);

  const resumeResult = await runner.resume({
    resumeData: { reply: 'Yes, proceed once monitoring is green.' },
  });

  if (resumeResult.status === 'finished') {
    context.log('resumed and completed', resumeResult.output);

    return;
  }

  if (resumeResult.status === 'suspended') {
    context.log('suspended again', {
      step: resumeResult.step.name,
      reason: resumeResult.reason,
      data: resumeResult.data,
    });

    return;
  }

  console.error('Workflow failed after resume', resumeResult.error);
}

// pnpm dlx ts-node packages/agentic/examples/suspend-resume/workflow.ts
void main();
