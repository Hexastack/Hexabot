/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import 'reflect-metadata';

export const ORM_HOOK_NAMES = [
  'beforeInsert',
  'afterInsert',
  'beforeUpdate',
  'afterUpdate',
  'beforeRemove',
  'afterRemove',
] as const;

export type OrmHookName = (typeof ORM_HOOK_NAMES)[number];

const HOOKS_KEY = Symbol('hooks');
const hook =
  (name: OrmHookName): MethodDecorator =>
  (target, key) => {
    const meta = Reflect.getOwnMetadata(HOOKS_KEY, target.constructor) || {};
    (meta[name] ??= []).push(key);
    Reflect.defineMetadata(HOOKS_KEY, meta, target.constructor);
  };

export const OnBeforeInsert = () => hook('beforeInsert');

export const OnAfterInsert = () => hook('afterInsert');

export const OnBeforeUpdate = () => hook('beforeUpdate');

export const OnAfterUpdate = () => hook('afterUpdate');

export const OnBeforeRemove = () => hook('beforeRemove');

export const OnAfterRemove = () => hook('afterRemove');

export const getOrmHookMethods = (
  target: any,
  name: OrmHookName,
): Array<string | symbol> => {
  const constructor =
    typeof target === 'function' ? target : target.constructor;

  return Reflect.getMetadata(HOOKS_KEY, constructor)?.[name] ?? [];
};

export const invokeOrmHooks = async (
  entity: any,
  hook: OrmHookName,
  event: any,
  targetClass?: any,
): Promise<void> => {
  if (!entity) return;

  const constructor = targetClass ?? entity.constructor;
  const methods = getOrmHookMethods(constructor, hook);

  for (const key of methods) {
    const handler = entity[key];
    if (typeof handler === 'function') {
      await handler.call(entity, event);
    }
  }
};
