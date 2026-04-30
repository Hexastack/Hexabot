/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CacheModule } from '@nestjs/cache-manager';
import { DynamicModule, ModuleMetadata, Provider } from '@nestjs/common';
import { SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import {
  DataSource,
  DataSourceOptions,
  EntitySchema,
  EntitySubscriberInterface,
  EntityTarget,
  getMetadataArgsStorage,
} from 'typeorm';

import {
  invokeOrmHooks,
  ORM_HOOK_NAMES,
  OrmHookName,
} from '@/database/decorators/orm-event-hooks.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { LanguageOrmEntity } from '@/i18n/entities/language.entity';
import { LoggerModule } from '@/logger/logger.module';
import { LoggerService } from '@/logger/logger.service';
import { MetadataOrmEntity } from '@/setting/entities/metadata.entity';
import { SettingOrmEntity } from '@/setting/entities/setting.entity';
import { SettingModule } from '@/setting/setting.module';

import { I18nTestingModule } from './modules/i18n-testing.module';
import { I18nServiceProvider } from './providers/i18n-service.provider';
import { registerTestingModule, registerTypeOrmDataSource } from './test';

type TTypeOrToken = [
  new (...args: any[]) => any,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  ...(new (...args: any[]) => any[]),
];

type ToUnionArray<T> = (NonNullable<T> extends (infer U)[] ? U : never)[];

type TypeOrmFixture = (dataSource: DataSource) => Promise<unknown> | unknown;

type TypeOrmTestingConfig = {
  entities?: EntityTarget<any>[];
  fixtures?: TypeOrmFixture | TypeOrmFixture[];
  dataSourceOptions?: Partial<DataSourceOptions>;
};
type TypeOrmTestingInput =
  | TypeOrmTestingConfig
  | TypeOrmTestingConfig[]
  | false;

type buildTestingMocksProps<
  P extends ModuleMetadata['providers'] = ModuleMetadata['providers'],
  C extends ModuleMetadata['controllers'] = ModuleMetadata['controllers'],
> = ModuleMetadata & {
  typeorm?: TypeOrmTestingInput;
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
const getClassDependencies = (
  parentClass: Provider,
  providedTokens = new Set<Provider>(),
): Provider[] => {
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
        if (
          paramType &&
          !seenClasses.has(paramType) &&
          !providedTokens.has(paramType)
        ) {
          classQueue.push(paramType);
          dependencies.push(paramType);
        }
      });
    }
  }

  return dependencies;
};
const filterNestedDependencies = (dependency: Provider) =>
  dependency.valueOf().toString().slice(0, 6) === 'class ';
const resolveProviderToken = (provider: Provider): Provider | undefined => {
  if (
    typeof provider === 'object' &&
    provider !== null &&
    'provide' in provider
  ) {
    return provider.provide as Provider;
  }

  return provider;
};
/**
 * Identifies nested class-based dependencies to be automatically injected into test modules.
 *
 * @param providers - Array of initial providers.
 * @returns Array of additional nested dependencies.
 */
const autoInjectExclusions = new Set<Provider>([DataSource]);
const getNestedDependencies = (providers: Provider[]): Provider[] => {
  const nestedDependencies = new Set<Provider>();
  const providedTokens = new Set<Provider>(
    providers
      .map(resolveProviderToken)
      .filter((provider): provider is Provider => provider !== undefined),
  );

  providers.filter(filterNestedDependencies).forEach((provider) => {
    getClassDependencies(provider, providedTokens)
      .filter(filterNestedDependencies)
      .forEach((dependency) => {
        if (autoInjectExclusions.has(dependency)) {
          return;
        }
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
const defaultProviders: Provider[] = [LoggerService];
const builtinOverrideProviders: Provider[] = [I18nServiceProvider];
const TYPEORM_REPOSITORY_SUFFIX = 'Repository';

type ProviderLike = Provider | undefined;

const resolveEntityTargetName = (
  target: EntityTarget<any>,
): string | undefined => {
  if (typeof target === 'function') {
    return target.name;
  }

  if (typeof target === 'string') {
    return target;
  }

  if (target instanceof EntitySchema) {
    return (
      target.options.name ??
      (typeof target.options.target === 'function'
        ? target.options.target.name
        : undefined)
    );
  }

  return undefined;
};
const buildEntityLookup = () => {
  const storage = getMetadataArgsStorage();
  const lookup = new Map<string, EntityTarget<any>>();

  storage.tables.forEach((table) => {
    const entityTarget = table.target as EntityTarget<any>;
    if (!entityTarget) {
      return;
    }

    const key = resolveEntityTargetName(entityTarget);
    if (key) {
      lookup.set(key, entityTarget);
    }
  });

  return lookup;
};
const addEntityToLookup = (
  lookup: Map<string, EntityTarget<any>>,
  entity: EntityTarget<any> | undefined,
): EntityTarget<any> | undefined => {
  if (!entity) {
    return undefined;
  }

  const key = resolveEntityTargetName(entity);
  if (key) {
    lookup.set(key, entity);
  }

  return entity;
};
const refreshEntityLookup = (lookup: Map<string, EntityTarget<any>>): void => {
  buildEntityLookup().forEach((entity, key) => lookup.set(key, entity));
};
const GENERATED_ORM_HOOK_SUBSCRIBER = Symbol('generatedOrmHookSubscriber');
type SubscriberWithListenTo = EntitySubscriberInterface & {
  listenTo: NonNullable<EntitySubscriberInterface['listenTo']>;
};
type GeneratedOrmHookSubscriber = SubscriberWithListenTo & {
  [GENERATED_ORM_HOOK_SUBSCRIBER]: true;
};
const isGeneratedOrmHookSubscriber = (
  subscriber: unknown,
): subscriber is GeneratedOrmHookSubscriber =>
  Boolean(
    subscriber &&
      typeof subscriber === 'object' &&
      (subscriber as Record<PropertyKey, unknown>)[
        GENERATED_ORM_HOOK_SUBSCRIBER
      ],
  );
const hasListenTo = (
  subscriber: unknown,
): subscriber is SubscriberWithListenTo =>
  Boolean(
    subscriber &&
      typeof subscriber === 'object' &&
      typeof (subscriber as { listenTo?: unknown }).listenTo === 'function',
  );
const registerAllRepositorySubscribers = (
  dataSource: DataSource,
  entityClasses: (new (...args: any[]) => BaseOrmEntity<any>)[],
): void => {
  for (const EntityClass of entityClasses) {
    const subscriber = {
      [GENERATED_ORM_HOOK_SUBSCRIBER]: true,
      listenTo: () => EntityClass,
      ...Object.fromEntries(
        ORM_HOOK_NAMES.map((name) => [
          name,
          async (event: any) => {
            await invokeOrmHooks(
              event.entity,
              name as OrmHookName,
              event,
              EntityClass,
            );
          },
        ]),
      ),
    };
    const exists = dataSource.subscribers.some(
      (subscriber) =>
        hasListenTo(subscriber) && subscriber.listenTo() === EntityClass,
    );
    if (!exists) {
      dataSource.subscribers.push(subscriber as any);
    }
  }
};
const pruneGeneratedRepositorySubscribers = (dataSource: DataSource): void => {
  const concreteSubscriberTargets = new Set(
    dataSource.subscribers
      .filter(
        (subscriber): subscriber is SubscriberWithListenTo =>
          !isGeneratedOrmHookSubscriber(subscriber) && hasListenTo(subscriber),
      )
      .map((subscriber) => subscriber.listenTo()),
  );
  const subscribers = dataSource.subscribers.filter(
    (subscriber) =>
      !isGeneratedOrmHookSubscriber(subscriber) ||
      !concreteSubscriberTargets.has(subscriber.listenTo()),
  );
  dataSource.subscribers.splice(
    0,
    dataSource.subscribers.length,
    ...subscribers,
  );
};
const normalizeRepositoryToken = (token: string): string | undefined => {
  if (!token.endsWith(TYPEORM_REPOSITORY_SUFFIX)) {
    return undefined;
  }

  const withoutSuffix = token.slice(0, -TYPEORM_REPOSITORY_SUFFIX.length);
  if (!withoutSuffix) {
    return undefined;
  }

  const segments = withoutSuffix.split('_');

  return segments[segments.length - 1] || undefined;
};
const resolveEntityFromToken = (
  token: unknown,
  lookup: Map<string, EntityTarget<any>>,
): EntityTarget<any> | undefined => {
  if (typeof token !== 'string') {
    return undefined;
  }

  const normalized = normalizeRepositoryToken(token);
  if (!normalized) {
    return undefined;
  }

  return lookup.get(normalized);
};
const extractCustomInjectTokens = (target: ProviderLike): unknown[] => {
  if (!target || typeof target !== 'function') {
    return [];
  }

  const dependencies =
    (Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) as
      | { index: number; param?: unknown }[]
      | undefined) ?? [];

  return dependencies
    .map((dependency) => dependency?.param)
    .filter((dependency): dependency is unknown => dependency !== undefined);
};
const extractInjectTokensFromProvider = (provider: ProviderLike): unknown[] => {
  if (!provider) {
    return [];
  }

  if (typeof provider === 'function') {
    return extractCustomInjectTokens(provider);
  }

  if (typeof provider === 'object') {
    const tokens: unknown[] = [];

    if ('useClass' in provider && typeof provider.useClass === 'function') {
      tokens.push(...extractCustomInjectTokens(provider.useClass));
    }

    if ('inject' in provider && Array.isArray(provider.inject)) {
      tokens.push(...provider.inject.filter(Boolean));
    }

    return tokens;
  }

  return [];
};
const dependsOnDataSource = (provider: ProviderLike): boolean => {
  if (!provider) {
    return false;
  }

  if (typeof provider === 'function') {
    return (
      getParamTypes(provider).includes(DataSource) ||
      extractCustomInjectTokens(provider).includes(DataSource)
    );
  }

  if (typeof provider === 'object') {
    if ('useClass' in provider && typeof provider.useClass === 'function') {
      return dependsOnDataSource(provider.useClass);
    }

    if ('inject' in provider && Array.isArray(provider.inject)) {
      return provider.inject.includes(DataSource);
    }
  }

  return false;
};
const registerAutoDetectedTypeOrmEntities = (
  currentEntities: Set<EntityTarget<any>>,
  providers: Provider[],
  controllers: ModuleMetadata['controllers'],
  lookup: Map<string, EntityTarget<any>>,
): boolean => {
  if (!lookup.size) {
    return false;
  }

  let detected = false;
  const controllerList = Array.isArray(controllers) ? controllers : [];
  const tokens = [
    ...providers.flatMap(extractInjectTokensFromProvider),
    ...controllerList.flatMap(extractInjectTokensFromProvider),
  ];

  tokens.forEach((token) => {
    const entity = resolveEntityFromToken(token, lookup);
    if (entity) {
      currentEntities.add(entity);
      detected = true;
    }
  });

  return detected;
};
const addEntityToSet = (
  entities: Set<EntityTarget<any>>,
  entity: EntityTarget<any> | undefined,
  queue: EntityTarget<any>[],
): void => {
  if (!entity || entities.has(entity)) {
    return;
  }

  entities.add(entity);
  queue.push(entity);
};
const isSameEntityTarget = (
  left: EntityTarget<any> | undefined,
  right: EntityTarget<any>,
): boolean => {
  if (!left) {
    return false;
  }

  if (left === right) {
    return true;
  }

  const leftName = resolveEntityTargetName(left);
  const rightName = resolveEntityTargetName(right);

  return !!leftName && leftName === rightName;
};
const resolveRelationTarget = async (
  relationType: unknown,
  lookup: Map<string, EntityTarget<any>>,
): Promise<EntityTarget<any> | undefined> => {
  if (typeof relationType === 'string') {
    return lookup.get(relationType);
  }

  if (typeof relationType === 'function') {
    try {
      const resolved = relationType();

      if (typeof resolved === 'string') {
        return resolveRelationTarget(resolved, lookup);
      }

      return addEntityToLookup(lookup, resolved as EntityTarget<any>);
    } catch {
      return addEntityToLookup(lookup, relationType as EntityTarget<any>);
    }
  }

  return undefined;
};
const registerInheritedTypeOrmEntities = (
  currentEntities: Set<EntityTarget<any>>,
  entity: EntityTarget<any>,
  lookup: Map<string, EntityTarget<any>>,
  queue: EntityTarget<any>[],
): void => {
  if (typeof entity !== 'function') {
    return;
  }

  let prototype = Object.getPrototypeOf(entity.prototype);

  while (prototype?.constructor && prototype.constructor !== Object) {
    const parent = lookup.get(prototype.constructor.name);
    if (parent) {
      addEntityToSet(currentEntities, parent, queue);
    }

    prototype = Object.getPrototypeOf(prototype);
  }
};
const registerChildTypeOrmEntities = (
  currentEntities: Set<EntityTarget<any>>,
  entity: EntityTarget<any>,
  lookup: Map<string, EntityTarget<any>>,
  queue: EntityTarget<any>[],
): void => {
  if (typeof entity !== 'function') {
    return;
  }

  getMetadataArgsStorage().tables.forEach((table) => {
    if (
      table.type !== 'entity-child' ||
      typeof table.target !== 'function' ||
      !entity.prototype.isPrototypeOf(table.target.prototype)
    ) {
      return;
    }

    addEntityToSet(
      currentEntities,
      addEntityToLookup(lookup, table.target as EntityTarget<any>),
      queue,
    );
  });
};
const registerRelatedTypeOrmEntities = async (
  currentEntities: Set<EntityTarget<any>>,
  lookup: Map<string, EntityTarget<any>>,
): Promise<void> => {
  const queue = Array.from(currentEntities);

  while (queue.length > 0) {
    const entity = queue.shift()!;
    const storage = getMetadataArgsStorage();

    refreshEntityLookup(lookup);
    registerInheritedTypeOrmEntities(currentEntities, entity, lookup, queue);
    registerChildTypeOrmEntities(currentEntities, entity, lookup, queue);

    const relations = storage.relations.filter((relation) =>
      isSameEntityTarget(relation.target as EntityTarget<any>, entity),
    );

    for (const relation of relations) {
      const relationEntity = await resolveRelationTarget(relation.type, lookup);
      addEntityToSet(currentEntities, relationEntity, queue);
    }

    for (const relation of storage.relations) {
      const relationEntity = await resolveRelationTarget(relation.type, lookup);

      if (isSameEntityTarget(relationEntity, entity)) {
        addEntityToSet(
          currentEntities,
          addEntityToLookup(lookup, relation.target as EntityTarget<any>),
          queue,
        );
      }
    }
  }
};

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
 *       imports: [...],
 *       providers: [UserService],
 *       typeorm: {
 *         entities: [
 *           AttachmentOrmEntity,
 *         ],
 *         fixtures: installSubscriberFixturesTypeOrm,
 *       },
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
  imports = [],
  providers = [],
  controllers = [],
  autoInjectFrom,
  typeorm,
  ...rest
}: buildTestingMocksProps) => {
  const injectedProviders = new Set<Provider>(defaultProviders);
  const injectionFrom = autoInjectFrom as ToUnionArray<typeof autoInjectFrom>;

  if (injectionFrom?.includes('providers')) {
    getNestedDependencies(providers).forEach((provider) =>
      injectedProviders.add(provider),
    );
  }

  if (injectionFrom?.includes('controllers')) {
    getNestedDependencies(controllers).forEach((controller) =>
      injectedProviders.add(controller),
    );
  }

  providers.forEach((provider) => injectedProviders.add(provider));
  const providersList = [...injectedProviders];
  const overrideProviders = [...builtinOverrideProviders, ...providersList];
  const overrideTokens = new Set<Provider>(
    overrideProviders
      .filter(
        (provider) =>
          typeof provider === 'object' &&
          provider !== null &&
          'provide' in provider,
      )
      .map((provider) => (provider as { provide: Provider }).provide),
  );
  const resolvedProviders = providersList.filter(
    (provider) =>
      !(
        typeof provider === 'function' &&
        overrideTokens.has(provider as unknown as Provider)
      ),
  );
  const typeOrmDisabled = typeorm === false;
  let typeOrmOptions: Partial<DataSourceOptions> | undefined;
  const typeOrmFixtures: TypeOrmFixture[] = [];
  const typeOrmConfigs =
    !typeOrmDisabled && Array.isArray(typeorm)
      ? typeorm.filter(Boolean)
      : !typeOrmDisabled && typeorm
        ? [typeorm]
        : [];
  const hasExplicitTypeOrmConfig = typeOrmConfigs.length > 0;
  const typeOrmEntities = new Set<EntityTarget<any>>();
  const entityLookup = buildEntityLookup();
  const hasTypeOrmEntityDependencies = registerAutoDetectedTypeOrmEntities(
    typeOrmEntities,
    providersList,
    controllers,
    entityLookup,
  );
  const controllerList = Array.isArray(controllers) ? controllers : [];
  const hasDataSourceDependencies = [...providersList, ...controllerList].some(
    dependsOnDataSource,
  );
  const shouldUseTypeOrm =
    !typeOrmDisabled &&
    (hasExplicitTypeOrmConfig ||
      hasTypeOrmEntityDependencies ||
      hasDataSourceDependencies);

  typeOrmConfigs.forEach((config) => {
    config.entities?.forEach((entity) => typeOrmEntities.add(entity));
    const fixtures = config.fixtures
      ? Array.isArray(config.fixtures)
        ? config.fixtures
        : [config.fixtures]
      : [];
    fixtures.forEach((fixture) => typeOrmFixtures.push(fixture));
    if (config.dataSourceOptions) {
      typeOrmOptions = {
        ...(typeOrmOptions ?? {}),
        ...config.dataSourceOptions,
      } as Partial<DataSourceOptions>;
    }
  });

  if (shouldUseTypeOrm && typeOrmEntities.size === 0) {
    entityLookup.forEach((entity) => typeOrmEntities.add(entity));
  }

  if (shouldUseTypeOrm) {
    [SettingOrmEntity, MetadataOrmEntity, LanguageOrmEntity].forEach((entity) =>
      typeOrmEntities.add(entity),
    );
    await registerRelatedTypeOrmEntities(typeOrmEntities, entityLookup);
  }

  const runTypeOrmFixtures = async (dataSource: DataSource) => {
    for (const fixture of typeOrmFixtures) {
      await fixture(dataSource);
    }
  };
  const entitiesArray = Array.from(typeOrmEntities);
  let typeOrmRootModule: DynamicModule | undefined;
  let typeOrmProviders: Provider[] = [];
  let typeOrmDataSource: DataSource | undefined;

  if (shouldUseTypeOrm) {
    const baseOptions: DataSourceOptions = {
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
      logging: false,
      entities: entitiesArray,
      ...(typeOrmOptions ?? {}),
    } as DataSourceOptions;
    const dataSource = new DataSource(baseOptions);
    await dataSource.initialize();
    typeOrmDataSource = dataSource;
    registerAllRepositorySubscribers(dataSource, entitiesArray as any[]);
    await runTypeOrmFixtures(dataSource);
    registerTypeOrmDataSource(dataSource);

    typeOrmRootModule = TypeOrmModule.forRootAsync({
      useFactory: async () => baseOptions as DataSourceOptions,
      dataSourceFactory: async () => dataSource,
    });
    typeOrmProviders = entitiesArray.map((entity) => ({
      provide: getRepositoryToken(entity as any),
      useValue: dataSource.getRepository(entity),
    }));
  }

  const testingModuleBuilder = Test.createTestingModule({
    imports: [
      LoggerModule,
      EventEmitterModule.forRoot({ global: true }),
      CacheModule.register({ isGlobal: true }),
      I18nTestingModule,
      ...(typeOrmRootModule ? [typeOrmRootModule, SettingModule] : []),
      ...imports,
    ],
    providers: [
      ...builtinOverrideProviders,
      ...resolvedProviders,
      ...typeOrmProviders,
    ],
    controllers,
    ...rest,
  });
  const module = await testingModuleBuilder.compile();
  if (typeOrmDataSource) {
    pruneGeneratedRepositorySubscribers(typeOrmDataSource);
  }
  registerTestingModule(module);

  return {
    module,
    getMocks: extractInstances('get', module),
    resolveMocks: extractInstances('resolve', module),
  };
};
