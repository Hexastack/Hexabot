/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseWorkflowContext } from '@hexabot-ai/agentic';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import EventWrapper from '@/channel/lib/EventWrapper';
import { Context } from '@/chat/types/context';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import type { WorkflowRunFull } from '@/workflow/dto/workflow-run.dto';
import { WorkflowContextState } from '@/workflow/types';

@Injectable({ scope: Scope.TRANSIENT })
export class WorkflowContext extends BaseWorkflowContext<
  WorkflowContextState,
  EventEmitter2
> {
  event?: EventWrapper<any, any>;

  @Inject(I18nService)
  private readonly i18n: I18nService;

  @Inject(SettingService)
  private readonly settings: SettingService;

  @Inject(LoggerService)
  private readonly logger: LoggerService;

  @Inject(EventEmitter2)
  readonly eventEmitter: EventEmitter2;

  get services() {
    return {
      i18n: this.i18n,
      settings: this.settings,
      logger: this.logger,
    };
  }

  get subscriberId(): string | undefined {
    return this.state.subscriberId as string | undefined;
  }

  set subscriberId(value: string | undefined) {
    this.state.subscriberId = value;
  }

  get workflowId(): string | undefined {
    return this.state.workflowId as string | undefined;
  }

  set workflowId(value: string | undefined) {
    this.state.workflowId = value;
  }

  get chatContext(): Context | undefined {
    return this.state.chatContext as Context | undefined;
  }

  set chatContext(value: Context | undefined) {
    this.state.chatContext = value;
  }

  get workflowRunId(): string | undefined {
    return this.state.runId as string | undefined;
  }

  set workflowRunId(value: string | undefined) {
    this.state.runId = value;
  }

  get runId(): string | undefined {
    return this.state.runId as string | undefined;
  }

  set runId(value: string | undefined) {
    this.state.runId = value;
  }

  buildFromRun(run: WorkflowRunFull, event: EventWrapper<any, any>): this {
    this.hydrate(run.context);
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
    this.event = event;
    this.subscriberId = run.subscriber?.id;
    this.workflowId = run.workflow.id;
    this.workflowRunId = run.id;

    return this;
  }

  hydrate(stored?: WorkflowContextState | null): this {
    if (!stored) {
      return this;
    }

    this.state = { ...this.state, ...stored };

    return this;
  }
}
