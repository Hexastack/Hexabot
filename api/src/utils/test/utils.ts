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
 * Retrieves constructor parameter types (dependencies) of a NestJS provider class.
 * Useful for inspecting dependencies to dynamically build NestJS testing modules.
 *
 * @param provider - The NestJS provider class to introspect.
 * @returns An array of parameter types representing the constructor dependencies.
 */
const getParamTypes = (provider: Provider) =>
  Reflect.getMetadata('design:paramtypes', provider) || [];

/**
 * Recursively resolves all unique dependencies required by a NestJS provider.
 * Essential for automating provider inclusion in NestJS unit tests.
 *
 * @param parentClass - The root provider class whose dependency graph is resolved.
 * @returns A complete array of unique provider dependencies.
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
 * Retrieves a Mongoose model definition from the LifecycleHookManager.
 *
 * @param name - The name of the model.
 * @param suffix - Optional suffix to trim from the name.
 * @returns The model definition.
 * @throws If the model cannot be found.
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
 * Extracts nested Mongoose models from a collection of providers.
 * Typically used for automating inclusion of models in test modules.
 *
 * @param extendedProviders - Array of providers to inspect.
 * @param suffix - Suffix identifying relevant providers (e.g., 'Repository').
 * @returns An array of model definitions.
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
 * Identifies nested class-based dependencies to be automatically injected into test modules.
 *
 * @param providers - Array of initial providers.
 * @returns Array of additional nested dependencies.
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
 * Determines if models can be automatically injected based on imports.
 * Specifically checks for presence of MongooseModule.
 *
 * @param imports - Modules imported in the test context.
 * @returns True if MongooseModule is included, enabling automatic model injection.
 */
const canInjectModels = (imports: buildTestingMocksProps['imports']): boolean =>
  (imports || []).some(
    (module) => 'module' in module && module.module.name === 'MongooseModule',
  );

/**
 * Retrieves model definitions for the provided models array.
 * Supports both string references and explicit ModelDefinition objects.
 *
 * @param models - Array of models specified by name or definition.
 * @returns Array of resolved model definitions.
 */
const getModels = (models: TModel[]): ModelDefinition[] =>
  models.map((model) =>
    typeof model === 'string' ? getModel(model, 'Model') : model,
  );

const defaultProviders = [
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
];

/**
 * Dynamically builds a NestJS TestingModule for unit tests with automated dependency resolution.
 * Includes functionality to inject models and nested providers/controllers based on provided configuration.
 *
 * @param props - Configuration for testing module setup.
 * @returns An object containing the compiled NestJS TestingModule and helpers to retrieve or resolve mock instances.
 *
 * @example
 * ```typescript
 * describe('UserService', () => {
 *   let userService: UserService;
 *
 *   beforeAll(async () => {
 *     const { getMocks } = await buildTestingMocks({
 *       autoInjectFrom: ['providers'],
 *       imports: [MongooseModule.forRoot('mongodb://localhost/test')],
 *       providers: [UserService],
 *     });
 *
 *     [userService] = await getMocks([UserService]);
 *   });
 *
 *   it('should be defined', () => {
 *     expect(userService).toBeDefined();
 *   });
 * });
 * ```
 */
export const buildTestingMocks = async ({
  models = [],
  imports = [],
  providers = [],
  controllers = [],
  autoInjectFrom,
  ...rest
}: buildTestingMocksProps) => {
  const extendedProviders = new Set<Provider>();
  const dynamicProviders = new Set<Provider>();
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
  [...defaultProviders, ...extendedProviders].forEach((provider) => {
    dynamicProviders.add(provider);
  });

  const module = await Test.createTestingModule({
    imports: [
      ...(canInjectModels(imports)
        ? [
            MongooseModule.forFeature([
              ...getModels(models),
              ...(autoInjectFrom
                ? getNestedModels([...dynamicProviders], 'Repository')
                : []),
            ]),
          ]
        : []),
      ...imports,
    ],
    providers: [...dynamicProviders],
    controllers,
    ...rest,
  }).compile();

  return {
    module,
    getMocks: extractInstances('get', module),
    resolveMocks: extractInstances('resolve', module),
  };
};
