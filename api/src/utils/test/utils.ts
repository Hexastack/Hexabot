/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ModuleMetadata, Provider } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from '@/logger/logger.service';

import { LifecycleHookManager } from '../generics/lifecycle-hook-manager';

type TTypeOrToken = [
  new (...args: any[]) => any,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  ...(new (...args: any[]) => any[]),
];

type model = ModelDefinition | `${string}Model`;

interface buildTestingMocksProps extends ModuleMetadata {
  models?: model[];
  autoInjectFrom?: ('all' | 'controllers' | 'providers')[];
}

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

const getParamTypes = (provider: Provider) =>
  Reflect.getMetadata('design:paramtypes', provider) || [];

const getClassDependencies = (parentClass: Provider): Provider[] => {
  const dependencies: Provider[] = [];
  const seenClasses = new Set<Provider>();
  const classQueue: Provider[] = [parentClass];

  while (classQueue.length > 0) {
    const currentClass = classQueue.pop()!;

    if (seenClasses.has(currentClass)) {
      continue;
    }

    seenClasses.add(currentClass);

    if (currentClass) {
      getParamTypes(currentClass).forEach((paramType: Provider) => {
        if (paramType && !seenClasses.has(paramType)) {
          classQueue.push(paramType);
          dependencies.push(paramType);
        }
      });
    }
  }

  return dependencies;
};

const getModel = (name: string, suffix = ''): ModelDefinition => {
  const modelName = name.replace(suffix, '');
  const model = LifecycleHookManager.getModel(modelName);

  if (!model) {
    throw new Error(`Unable to find '${modelName}' model!`);
  }

  return model;
};

const getNestedModels = (
  dynamicProviders: Provider[],
  suffix = '',
): ModelDefinition[] =>
  dynamicProviders.reduce((acc, dynamicProvider) => {
    if ('name' in dynamicProvider && dynamicProvider.name.endsWith(suffix)) {
      const model = getModel(dynamicProvider.name, suffix);
      acc.push(model);
    }

    return acc;
  }, [] as ModelDefinition[]);

const filterNestedDependencies = (dependency: Provider) =>
  dependency.valueOf().toString().slice(0, 6) === 'class ';

const getNestedDependencies = (dynamicProviders: Provider[]): Provider[] => {
  const nestedDependencies: Provider[] = [];

  dynamicProviders.filter(filterNestedDependencies).forEach((provider) => {
    getClassDependencies(provider)
      .filter(filterNestedDependencies)
      .forEach((dependency) => {
        if (
          !dynamicProviders.includes(dependency) &&
          !dynamicProviders.find(
            (dynamicProvider) =>
              'provide' in dynamicProvider &&
              dynamicProvider.provide === dependency,
          )
        ) {
          nestedDependencies.push(dependency);
        }
      });
  });

  return nestedDependencies;
};

const canInjectModels = (imports: buildTestingMocksProps['imports']): boolean =>
  (imports || []).findIndex(
    (dynamicModule) =>
      'module' in dynamicModule &&
      dynamicModule.module.name === 'MongooseModule',
  ) > -1;

const getModels = (models: model[]): ModelDefinition[] =>
  models.map((model) =>
    typeof model === 'string' ? getModel(model, 'Model') : model,
  );

export const buildTestingMocks = async ({
  models = [],
  imports = [],
  providers = [],
  controllers = [],
  autoInjectFrom,
  ...rest
}: buildTestingMocksProps) => {
  const nestedProviders: Provider[] = [];
  const canAutoInjectFromAll = autoInjectFrom?.includes('all');

  if (canAutoInjectFromAll || autoInjectFrom?.includes('providers')) {
    nestedProviders.push(...providers, ...getNestedDependencies(providers));
  }

  if (canAutoInjectFromAll || autoInjectFrom?.includes('controllers')) {
    nestedProviders.push(...controllers, ...getNestedDependencies(controllers));
  }

  const module = await Test.createTestingModule({
    imports: [
      ...(canInjectModels(imports)
        ? [
            MongooseModule.forFeature([
              ...getModels(models),
              ...(!!autoInjectFrom
                ? getNestedModels(nestedProviders, 'Repository')
                : []),
            ]),
          ]
        : []),
      ...imports,
    ],
    providers: [
      LoggerService,
      EventEmitter2,
      {
        provide: CACHE_MANAGER,
        useValue: {
          del: jest.fn(),
          set: jest.fn(),
          get: jest.fn(),
        },
      },
      ...(autoInjectFrom ? nestedProviders : []),
      ...providers,
    ],
    controllers,
    ...rest,
  }).compile();

  return {
    module,
    getMocks: extractInstances('get', module),
    resolveMocks: extractInstances('resolve', module),
  };
};
