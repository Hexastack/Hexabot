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

type TModel = ModelDefinition | `${string}Model`;

type ToUnionArray<T> = (NonNullable<T> extends (infer U)[] ? U : never)[];

type buildTestingMocksProps<
  P extends ModuleMetadata['providers'] = ModuleMetadata['providers'],
  C extends ModuleMetadata['controllers'] = ModuleMetadata['controllers'],
> = ModuleMetadata & {
  models?: TModel[];
} & (
    | {
        providers: NonNullable<P>;
        controllers: NonNullable<C>;
        autoInjectFrom: ('providers' | 'controllers')[];
      }
    | {
        providers: NonNullable<P>;
        autoInjectFrom?: 'providers'[];
      }
    | {
        controllers: NonNullable<C>;
        autoInjectFrom?: 'controllers'[];
      }
    | {
        providers?: never;
        controllers?: never;
        autoInjectFrom?: never;
      }
  );

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

/**
 * Retrieves a provider metadata
 * @param provider - provider
 * @returns a provider metadata
 */
const getParamTypes = (provider: Provider) =>
  Reflect.getMetadata('design:paramtypes', provider) || [];

/**
 * Retrieves an array of providers
 * @param parentClass - parent provider class
 * @returns an array of providers
 */
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

/**
 * Retrieves a model
 * @param name - model name
 * @param suffix - model name suffix
 * @returns a model
 */
const getModel = (name: string, suffix = ''): ModelDefinition => {
  const modelName = name.replace(suffix, '');
  const model = LifecycleHookManager.getModel(modelName);

  if (!model) {
    throw new Error(`Unable to find model for name '${modelName}!'`);
  }

  return model;
};

/**
 * Retrieves an array of nested models
 * @param extendedProviders - array of providers (Repositories)
 * @param suffix - suffix
 * @returns an array of nested models
 */
const getNestedModels = (
  extendedProviders: Provider[],
  suffix = '',
): ModelDefinition[] =>
  extendedProviders.reduce((acc, extendedProvider) => {
    if ('name' in extendedProvider && extendedProvider.name.endsWith(suffix)) {
      const model = getModel(extendedProvider.name, suffix);
      acc.push(model);
    }

    return acc;
  }, [] as ModelDefinition[]);

const filterNestedDependencies = (dependency: Provider) =>
  dependency.valueOf().toString().slice(0, 6) === 'class ';

/**
 * Checks if a the imports includes a MongooseModule
 * @param providers - array of providers
 * @returns an array of nested dependencies
 */
const getNestedDependencies = (providers: Provider[]): Provider[] => {
  const nestedDependencies = new Set<Provider>();

  providers.filter(filterNestedDependencies).forEach((provider) => {
    getClassDependencies(provider)
      .filter(filterNestedDependencies)
      .forEach((dependency) => {
        if (
          !providers.includes(dependency) &&
          !providers.find(
            (provider) =>
              'provide' in provider && provider.provide === dependency,
          )
        ) {
          nestedDependencies.add(dependency);
        }
      });
  });

  return [...nestedDependencies];
};

/**
 * Checks if a the imports includes a MongooseModule
 * @param imports - array of modules
 * @returns true if the imports includes a MongooseModule
 */
const canInjectModels = (imports: buildTestingMocksProps['imports']): boolean =>
  (imports || []).some(
    (module) => 'module' in module && module.module.name === 'MongooseModule',
  );

/**
 * Retrieves models
 * @param models - array of models
 * @returns an array of models
 */
const getModels = (models: TModel[]): ModelDefinition[] =>
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
  const extendedProviders = new Set<Provider>();
  const injectionFrom = autoInjectFrom as ToUnionArray<typeof autoInjectFrom>;

  if (injectionFrom?.includes('providers')) {
    [...getNestedDependencies(providers)].forEach((provider) =>
      extendedProviders.add(provider),
    );
  }

  if (injectionFrom?.includes('controllers')) {
    [...getNestedDependencies(controllers)].forEach((controller) =>
      extendedProviders.add(controller),
    );
  }

  providers.forEach((provider) => extendedProviders.add(provider));

  const module = await Test.createTestingModule({
    imports: [
      ...(canInjectModels(imports)
        ? [
            MongooseModule.forFeature([
              ...getModels(models),
              ...(autoInjectFrom
                ? getNestedModels([...extendedProviders], 'Repository')
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
      ...extendedProviders,
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
