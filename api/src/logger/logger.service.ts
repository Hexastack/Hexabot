/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  ConsoleLogger,
  Inject,
  Injectable,
  LogLevel,
  Scope,
} from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  private logLevels: LogLevel[] = [];

  constructor(@Inject(INQUIRER) private parentClass: object) {
    super(parentClass.constructor.name);
    this.initLogLevels();
  }

  log(message: string, ...args: any[]) {
    if (!this.isLevelEnabled('log')) {
      return;
    }
    super.log(message);
    this.logArguments('log', args);
  }

  error(message: string, ...args: any[]) {
    if (!this.isLevelEnabled('error')) {
      return;
    }
    super.error(message);
    this.logArguments('error', args);
  }

  warn(message: string, ...args: any[]) {
    if (!this.isLevelEnabled('warn')) {
      return;
    }
    super.warn(message);
    this.logArguments('warn', args);
  }

  debug(message: string, ...args: any[]) {
    if (!this.isLevelEnabled('debug')) {
      return;
    }
    super.debug(message);
    this.logArguments('debug', args);
  }

  verbose(message: string, ...args: any[]) {
    if (!this.isLevelEnabled('verbose')) {
      return;
    }
    super.verbose(message);
    this.logArguments('verbose', args);
  }

  fatal(message: string, ...args: any[]) {
    if (!this.isLevelEnabled('fatal')) {
      return;
    }
    super.fatal(message);
    this.logArguments('fatal', args);
  }

  private logArguments(type: LogLevel, args: any[]) {
    args.forEach((arg) => {
      super[type](arg);
    });
  }

  private initLogLevels() {
    process.env.NODE_ENV?.includes('dev')
      ? this.logLevels.push('log', 'debug', 'error', 'verbose', 'fatal', 'warn')
      : this.logLevels.push('log', 'warn', 'error');
    super.setLogLevels(this.logLevels);
  }
}
