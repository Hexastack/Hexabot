/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseWorkflowContext } from '@hexabot-ai/agentic';
import { forwardRef, Inject, Injectable, Scope } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ActionService } from '@/actions';
import { MessageService } from '@/chat/services/message.service';
import { ContentTypeService } from '@/cms/services/content-type.service';
import { ContentService } from '@/cms/services/content.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import type { WorkflowRunFull } from '@/workflow/dto/workflow-run.dto';
import { WorkflowContextState } from '@/workflow/types';

import { TriggerEventWrapper } from '../lib/trigger-event-wrapper';

@Injectable({ scope: Scope.TRANSIENT })
export abstract class WorkflowRuntimeContext<
  E extends TriggerEventWrapper = TriggerEventWrapper,
> extends BaseWorkflowContext<WorkflowContextState, EventEmitter2> {
  abstract event: E;

  @Inject(I18nService)
  protected readonly i18n: I18nService;

  @Inject(SettingService)
  protected readonly settings: SettingService;

  @Inject(LoggerService)
  protected readonly logger: LoggerService;

  @Inject(ContentService)
  protected readonly content: ContentService;

  @Inject(ContentTypeService)
  protected readonly contentType: ContentTypeService;

  @Inject(EventEmitter2)
  readonly eventEmitter: EventEmitter2;

  @Inject(forwardRef(() => MessageService))
  protected readonly message: MessageService;

  @Inject(ActionService)
  protected readonly actionService: ActionService;

  constructor() {
    super({} as WorkflowContextState);
  }

  get services() {
    return {
      i18n: this.i18n,
      settings: this.settings,
      logger: this.logger,
      content: this.content,
      contentType: this.contentType,
      message: this.message,
      actions: this.actionService,
    };
  }

  get workflowId(): string | undefined {
    return this.state.workflowId as string | undefined;
  }

  set workflowId(value: string | undefined) {
    this.state.workflowId = value;
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

  get initiatorId(): string | undefined {
    return this.state.initiatorId as string | undefined;
  }

  set initiatorId(value: string | undefined) {
    this.state.initiatorId = value;
  }

  buildFromRun(run: WorkflowRunFull, event: E): this {
    this.resetState();
    this.hydrate(run.context);
    this.event = event;
    this.initiatorId = run.triggeredBy?.id;
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

  protected resetState() {
    this.state = {} as WorkflowContextState;
  }
}
