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
import { CredentialService } from '@/user';
import type { WorkflowRunFull } from '@/workflow/dto/workflow-run.dto';
import { WorkflowContextState } from '@/workflow/types';

import { TriggerEventWrapper } from '../lib/trigger-event-wrapper';
import { MemoryStore } from '../utils/memory-store';

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

  @Inject(CredentialService)
  protected readonly credentialService: CredentialService;

  public memoryStore: MemoryStore;

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
      credentials: this.credentialService,
    };
  }

  get workflowId(): string {
    return this.state.workflowId;
  }

  set workflowId(value: string) {
    this.state.workflowId = value;
  }

  get workflowRunId(): string {
    return this.state.runId;
  }

  set workflowRunId(value: string) {
    this.state.runId = value;
  }

  get runId(): string | undefined {
    return this.state.runId;
  }

  set runId(value: string) {
    this.state.runId = value;
  }

  get initiatorId(): string {
    return this.state.initiatorId;
  }

  set initiatorId(value: string) {
    this.state.initiatorId = value;
  }

  async buildFromRun(
    run: WorkflowRunFull,
    event: E,
    memory: MemoryStore,
  ): Promise<this> {
    this.resetState();
    this.event = event;
    // Hydrate persisted state first, then merge transient event context.
    await this.hydrate(run.context);
    await this.hydrate(event.getContextData());
    this.initiatorId = run.triggeredBy.id;
    this.workflowId = run.workflow.id;
    this.workflowRunId = run.id;
    this.memoryStore = memory;
    this.memoryStore.syncToContext();

    return this;
  }

  async hydrate(
    stored?: Record<string, unknown> | WorkflowContextState | null,
  ): Promise<this> {
    if (!stored) {
      return this;
    }

    this.state = {
      ...this.state,
      ...stored,
    };

    return this;
  }

  protected resetState() {
    this.state = {} as WorkflowContextState;
  }
}
