/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, Scope } from '@nestjs/common';

import ConversationalEventWrapper from '@/channel/lib/ConversationalEventWrapper';
import { Context } from '@/chat/types/context';
import type { WorkflowRunFull } from '@/workflow/dto/workflow-run.dto';

import { WorkflowRuntimeContext } from './base-workflow-context';

@Injectable({ scope: Scope.TRANSIENT })
export class ConversationalWorkflowContext extends WorkflowRuntimeContext<
  ConversationalEventWrapper<any, any>
> {
  get subscriberId(): string | undefined {
    return this.state.subscriberId as string | undefined;
  }

  set subscriberId(value: string | undefined) {
    this.state.subscriberId = value;
  }

  get chatContext(): Context | undefined {
    return this.state.chatContext as Context | undefined;
  }

  set chatContext(value: Context | undefined) {
    this.state.chatContext = value;
  }

  override buildFromRun(
    run: WorkflowRunFull,
    event: ConversationalEventWrapper<any, any>,
  ): this {
    super.buildFromRun(run, event);
    this.subscriberId = run.triggeredBy?.id;

    const legacyContext = (this.state as any).conversationContext as
      | Context
      | undefined;
    if (legacyContext && !this.chatContext) {
      this.chatContext = legacyContext;
    }
    const legacyConversationId = (this.state as any).conversationId as
      | string
      | undefined;
    if (legacyConversationId && !this.runId) {
      this.runId = legacyConversationId;
    }
    delete (this.state as any).conversationContext;
    delete (this.state as any).conversationId;

    return this;
  }
}
