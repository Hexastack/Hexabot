/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseWorkflowContext } from '@hexabot-ai/agentic';
import { Injectable, Scope } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

@Injectable({ scope: Scope.TRANSIENT })
export class WorkflowContext extends BaseWorkflowContext {
  constructor(
    private readonly i18n: I18nService,
    private readonly settings: SettingService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  get services() {
    return {
      i18n: this.i18n,
      settings: this.settings,
      eventEmitter: this.eventEmitter,
      logger: this.logger,
    };
  }
}
