/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  AbstractAction,
  ActionExecutionArgs,
  ActionMetadata,
  BaseWorkflowContext,
  Settings,
} from '@hexabot-ai/agentic';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { I18nTranslation } from 'nestjs-i18n';
import { Observable } from 'rxjs';

import { HyphenToUnderscore } from '@/utils/types/extension';
import { WorkflowContext } from '@/workflow/services/workflow-context';

import { ActionService } from './actions.service';
import { ActionName } from './types';

@Injectable()
export abstract class BaseAction<
    I = unknown,
    O = unknown,
    C extends BaseWorkflowContext = WorkflowContext,
    S extends Settings = Settings,
  >
  extends AbstractAction<I, O, C, S>
  implements OnModuleInit
{
  private translations?: I18nTranslation | Observable<I18nTranslation>;

  protected constructor(
    metadata: ActionMetadata<I, O, S>,
    private readonly actionService: ActionService,
  ) {
    super(metadata);
  }

  getName(): ActionName {
    return this.name as ActionName;
  }

  getNamespace<N extends ActionName = ActionName>() {
    return this.getName().replaceAll('-', '_') as HyphenToUnderscore<N>;
  }

  getTranslations() {
    return this.translations;
  }

  async onModuleInit() {
    this.actionService.register(this);
  }

  abstract execute(args: ActionExecutionArgs<I, C, S>): Promise<O>;
}
