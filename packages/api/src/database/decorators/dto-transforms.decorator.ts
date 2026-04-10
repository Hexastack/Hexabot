/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TDto } from '@/utils/types/dto.types';

type ClassConstructor<T = unknown> = new (...args: any[]) => T;

export type DtoClassMetadata = {
  plain: ClassConstructor;
  full: ClassConstructor;
};

const DTO_CLASSES_METADATA_KEY = Symbol('dto_classes');

export function EntityDto<Dto extends TDto = TDto>(
  metadata: Dto['transformers'],
): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(DTO_CLASSES_METADATA_KEY, metadata, target);
  };
}

export function getDtoClassesMetadata(
  target: object,
): DtoClassMetadata | undefined {
  return Reflect.getMetadata(DTO_CLASSES_METADATA_KEY, target) as
    | DtoClassMetadata
    | undefined;
}
