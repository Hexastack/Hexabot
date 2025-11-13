/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerModule, LoggerService } from '@hexabot/logger';
import { MetadataOrmEntity, SettingModule } from '@hexabot/setting';
import { SettingOrmEntity } from '@hexabot/setting/entities/setting.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { DynamicModule, ModuleMetadata, Provider } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions, EntityTarget } from 'typeorm';

import { LanguageOrmEntity } from '@/i18n/entities/language.entity';

import { registerTypeOrmDataSource } from './test';

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

type buildTestingMocksProps<
  P extends ModuleMetadata['providers'] = ModuleMetadata['providers'],
  C extends ModuleMetadata['controllers'] = ModuleMetadata['controllers'],
> = ModuleMetadata & {
  typeorm?: TypeOrmTestingConfig | TypeOrmTestingConfig[];
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
const filterNestedDependencies = (dependency: Provider) =>
  dependency.valueOf().toString().slice(0, 6) === 'class ';
/**
 * Identifies nested class-based dependencies to be automatically injected into test modules.
 *
 * @param providers - Array of initial providers.
 * @returns Array of additional nested dependencies.
 */
const autoInjectExclusions = new Set<Provider>([DataSource]);
const getNestedDependencies = (providers: Provider[]): Provider[] => {
  const nestedDependencies = new Set<Provider>();

  providers.filter(filterNestedDependencies).forEach((provider) => {
    getClassDependencies(provider)
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
  const overrideTokens = new Set<Provider>(
    providersList
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
  const defaultTypeOrmEntities: EntityTarget<any>[] = [
    SettingOrmEntity,
    MetadataOrmEntity,
    LanguageOrmEntity,
  ];
  const typeOrmEntities = new Set<EntityTarget<any>>(defaultTypeOrmEntities);
  let typeOrmOptions: Partial<DataSourceOptions> | undefined;
  const typeOrmFixtures: TypeOrmFixture[] = [];
  const typeOrmConfigs = Array.isArray(typeorm)
    ? typeorm.filter(Boolean)
    : typeorm
      ? [typeorm]
      : [];

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

  const runTypeOrmFixtures = async (dataSource: DataSource) => {
    for (const fixture of typeOrmFixtures) {
      await fixture(dataSource);
    }
  };
  const entitiesArray = Array.from(typeOrmEntities);
  const baseOptions: DataSourceOptions = {
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    dropSchema: true,
    logging: false,
    entities: entitiesArray,
    ...(typeOrmOptions ?? {}),
  } as DataSourceOptions;
  const dataSource = new DataSource(baseOptions);
  await dataSource.initialize();
  await runTypeOrmFixtures(dataSource);
  registerTypeOrmDataSource(dataSource);

  const typeOrmRootModule: DynamicModule = TypeOrmModule.forRootAsync({
    useFactory: async () => baseOptions as DataSourceOptions,
    dataSourceFactory: async () => dataSource,
  });
  const typeOrmProviders = entitiesArray.map((entity) => ({
    provide: getRepositoryToken(entity as any),
    useValue: dataSource.getRepository(entity),
  }));
  const testingModuleBuilder = Test.createTestingModule({
    imports: [
      LoggerModule,
      EventEmitterModule.forRoot({ global: true }),
      CacheModule.register({ isGlobal: true }),
      typeOrmRootModule,
      SettingModule,
      ...imports,
    ],
    providers: [...resolvedProviders, ...typeOrmProviders],
    controllers,
    ...rest,
  });
  const module = await testingModuleBuilder.compile();

  return {
    module,
    getMocks: extractInstances('get', module),
    resolveMocks: extractInstances('resolve', module),
  };
};
