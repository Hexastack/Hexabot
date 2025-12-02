/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseWorkflowContext } from '@hexabot-ai/agentic';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';

import { BaseAction } from './base-action';
import { ActionName, ActionRegistry } from './types';

@Injectable()
export class ActionService {
  private readonly registry: ActionRegistry<
    BaseAction<any, any, BaseWorkflowContext, any>
  > = new Map();

  constructor(private readonly logger: LoggerService) {}

  register<C extends BaseWorkflowContext>(
    action: BaseAction<any, any, C, any>,
  ) {
    const name = action.getName();
    if (this.registry.has(name)) {
      throw new InternalServerErrorException(
        `Action with name ${name} already exist`,
      );
    }

    this.registry.set(name, action);
    this.logger.log(`Action "${name}" has been registered!`);
  }

  get(name: ActionName) {
    const action = this.registry.get(name);
    if (!action) {
      throw new Error(`Unable to find action "${name}"`);
    }

    return action;
  }

  getAll() {
    return Array.from(this.registry.values());
  }
}
