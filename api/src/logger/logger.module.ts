/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { DynamicModule, Module, Scope } from '@nestjs/common';

import { LoggerService } from './logger.service';

const LOGGER_CONTEXT = 'LOGGER_CONTEXT';

@Module({})
export class LoggerModule {
  static register(context: string): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: LOGGER_CONTEXT, // Provide the context as a separate injectable
          useValue: context,
        },
        {
          provide: LoggerService,
          useFactory: () => new LoggerService(context),
          inject: [LOGGER_CONTEXT], // Inject the context into the factory
          scope: Scope.TRANSIENT,
        },
      ],
      exports: [LoggerService],
    };
  }
}
