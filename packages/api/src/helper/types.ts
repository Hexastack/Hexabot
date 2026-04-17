/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AnySetting, ExtensionSetting } from '@/setting/types';

import BaseHelper from './lib/base-helper';
import { BaseLlmHelper } from './lib/base-llm-helper';
import { BaseStorageHelper } from './lib/base-storage-helper';

export namespace LLM {
  /**
   * Schema is used to define the format of input/output data.
   * Represents a select subset of an OpenAPI 3.0 schema object.
   * More fields may be added in the future as needed.
   * @public
   */
  export interface ResponseSchema {
    /**
     * Optional. The type of the property. {@link
     * SchemaType}.
     */
    type?: ResponseSchemaType;
    /** Optional. The format of the property. */
    format?: string;
    /** Optional. The description of the property. */
    description?: string;
    /** Optional. Whether the property is nullable. */
    nullable?: boolean;
    /** Optional. The items of the property. */
    items?: ResponseSchema;
    /** Optional. The enum of the property. */
    enum?: string[];
    /** Optional. Map of {@link Schema}. */
    properties?: {
      [k: string]: ResponseSchema;
    };
    /** Optional. Array of required property. */
    required?: string[];
    /** Optional. The example of the property. */
    example?: unknown;
  }

  /**
   * Contains the list of OpenAPI data types
   * as defined by https://swagger.io/docs/specification/data-models/data-types/
   * @public
   */
  export enum ResponseSchemaType {
    /** String type. */
    STRING = 'string',
    /** Number type. */
    NUMBER = 'number',
    /** Integer type. */
    INTEGER = 'integer',
    /** Boolean type. */
    BOOLEAN = 'boolean',
    /** Array type. */
    ARRAY = 'array',
    /** Object type. */
    OBJECT = 'object',
  }
}

export enum HelperType {
  LLM = 'llm',
  STORAGE = 'storage',
  UTIL = 'util',
}

export type HelperName = string;

interface HelperTypeMap {
  [HelperType.LLM]: BaseLlmHelper<HelperName>;
  [HelperType.STORAGE]: BaseStorageHelper<HelperName>;
  [HelperType.UTIL]: BaseHelper;
}

export type TypeOfHelper<T extends HelperType> = HelperTypeMap[T];

export type HelperRegistry<H extends BaseHelper = BaseHelper> = Map<
  HelperType,
  Map<string, H>
>;

export type HelperSetting<N extends HelperName = HelperName> = ExtensionSetting<
  {
    group: N;
  },
  AnySetting,
  'id' | 'createdAt' | 'updatedAt' | 'group'
>;
