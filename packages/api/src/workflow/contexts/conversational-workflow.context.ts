/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, Scope } from '@nestjs/common';

import ConversationalEventWrapper from '@/channel/lib/ConversationalEventWrapper';
import { ChatContext } from '@/chat/types/chat-context';

import { WorkflowRuntimeContext } from './workflow-runtime.context';

@Injectable({ scope: Scope.TRANSIENT })
export class ConversationalWorkflowContext extends WorkflowRuntimeContext<
  ConversationalEventWrapper<any, any>
> {
  event: ConversationalEventWrapper<any, any>;

  get chatContext(): ChatContext | undefined {
    return this.state.chatContext as ChatContext | undefined;
  }

  set chatContext(value: ChatContext | undefined) {
    this.state.chatContext = value;
  }
}
