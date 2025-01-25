/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ConsoleLogger, Global, Injectable } from '@nestjs/common';

import { loggingStorage } from './logger.context';

@Global()
@Injectable()
export class LoggerService extends ConsoleLogger {
  constructor(private readonly moduleContext: string) {
    super(moduleContext);
  }

  private getCallerContext(): string[] {
    const store = loggingStorage.getStore();
    const classMethod = store ? `${store.className}.${store.methodName}` : null;
    return [this.moduleContext, classMethod].filter(Boolean) as string[];
  }

  private buildContext(): string {
    return [...this.getCallerContext()].filter(Boolean).join('::');
  }

  log(message: any, ...args: any) {
    super.setContext(this.buildContext());
    super.log(message, ...args);
  }

  error(message: any, ...args: any) {
    super.setContext(this.buildContext());
    super.error(message, ...args);
  }

  warn(message: any, ...args: any) {
    super.setContext(this.buildContext());
    super.warn(message, ...args);

    // super.warn(message, this.buildContext(), ...args);
  }

  debug(message: any, ...args: any) {
    super.setContext(this.buildContext());
    // super.debug(message, this.buildContext(), ...args);
    super.debug(message, ...args);
  }

  verbose(message: any, ...args: any) {
    super.setContext(this.buildContext());
    super.verbose(message, ...args);
    // super.verbose(message, this.buildContext(), ...args);
  }
}
