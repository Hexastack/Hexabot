/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Type } from '@nestjs/common';

const EXTENSION_INJECT_META = Symbol('extension:inject');

type ExtensionProviderFactory = (extensionName: string) => Type<any>;

interface ExtensionInjectMeta {
  propertyKey: string | symbol;
  factory: ExtensionProviderFactory;
}

/**
 * Declare a lazily-instantiated, per-extension provider on a handler property.
 *
 * The base ChannelHandler resolves all decorated properties during onModuleInit
 * via ModuleRef.create(), so the full NestJS DI lifecycle is respected.
 *
 * Pass a plain class for providers that don't depend on the extension name:
 *   @ExtensionInject(WebSessionService)
 *
 * Pass an arrow-function factory when the provider type is built from the name:
 *   @ExtensionInject((name) => createWebOutboundMessageEncoder(name))
 */
export function ExtensionInject(
  ref: Type<any> | ExtensionProviderFactory,
): PropertyDecorator {
  // Arrow functions have no .prototype; class constructors always do.
  const factory: ExtensionProviderFactory = ref.prototype
    ? () => ref as Type<any>
    : (ref as ExtensionProviderFactory);

  return (target, propertyKey) => {
    const existing: ExtensionInjectMeta[] =
      Reflect.getOwnMetadata(EXTENSION_INJECT_META, target) ?? [];
    Reflect.defineMetadata(
      EXTENSION_INJECT_META,
      [...existing, { propertyKey, factory }],
      target,
    );
  };
}

/**
 * Collects all @ExtensionInject() metadata across the full prototype chain of
 * an instance, from the topmost ancestor down to the concrete class, so that
 * parent-class providers are instantiated before child-class ones.
 */
export function collectExtensionInjectMeta(
  instance: object,
): ExtensionInjectMeta[] {
  const result: ExtensionInjectMeta[] = [];
  let proto = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    const meta: ExtensionInjectMeta[] =
      Reflect.getOwnMetadata(EXTENSION_INJECT_META, proto) ?? [];
    result.unshift(...meta);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
}
