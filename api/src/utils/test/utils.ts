/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModuleMetadata } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from '@/logger/logger.service';

type TTypeOrToken = [
  new (...args: any[]) => any,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  ...(new (...args: any[]) => any[]),
];
const findInstances = async <T extends TTypeOrToken>(
  type: keyof TestingModule,
  module: TestingModule,
  typesOrTokens: T,
): Promise<{ [K in keyof T]: InstanceType<T[K]> }> =>
  Promise.all(
    typesOrTokens.map((typeOrToken) =>
      module[type.toString()]<InstanceType<typeof typeOrToken>>(typeOrToken),
    ),
  );

const extractInstances =
  (type: keyof TestingModule, module: TestingModule) =>
  async <T extends TTypeOrToken>(types: T) =>
    await findInstances(type, module, types);

export const buildTestingMocks = async ({
  providers,
  ...rest
}: ModuleMetadata) => {
  const module = await Test.createTestingModule({
    ...rest,
    ...(providers && {
      providers: [LoggerService, EventEmitter2, ...providers],
    }),
  }).compile();

  return {
    module,
    getMocks: extractInstances('get', module),
    resolveMocks: extractInstances('resolve', module),
  };
};
