/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ConsoleLogger, Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

type TLog = 'log' | 'warn' | 'error' | 'verbose' | 'debug';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor(@Inject(INQUIRER) private parentClass: object) {
    super(parentClass.constructor.name);
  }

  log(message: any, ...args: any[]) {
    super.log(message);
    this.logArguments('log', args);
  }

  error(message: any, ...args: any[]) {
    super.error(message);
    this.logArguments('error', args);
  }

  warn(message: any, ...args: any[]) {
    super.warn(message);
    this.logArguments('warn', args);
  }

  debug(message: any, ...args: any[]) {
    super.debug(message);
    this.logArguments('debug', args);
  }

  verbose(message: any, ...args: any[]) {
    super.verbose(message);
    this.logArguments('verbose', args);
  }

  private safeStringifyReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular Reference]';
        seen.add(value);
      }
      return value;
    };
  }

  private handleError(type: TLog, error: Error) {
    const errorInfo = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
    super[type](JSON.stringify(errorInfo, this.safeStringifyReplacer()));
  }

  private logArguments(type: TLog, args: any[]) {
    const isDevMode = process.env.NODE_ENV?.includes('dev');
    if (isDevMode) {
      args.forEach((arg) => {
        if (arg instanceof Error) {
          this.handleError(type, arg);
        } else if (typeof arg === 'object' && arg !== null) {
          super[type](JSON.stringify(arg, this.safeStringifyReplacer()));
        } else {
          super[type](arg);
        }
      });
    } else {
      // In production we do not stringify the arguments for performance reasons, except for errors
      args.forEach((arg) => {
        if (arg instanceof Error) {
          this.handleError(type, arg);
        } else {
          super[type](arg);
        }
      });
    }
  }
}
