/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import 'reflect-metadata';

export type OrmHookName =
  | 'beforeInsert'
  | 'afterInsert'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeRemove'
  | 'afterRemove';

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
