/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NlpEntityFull, NlpEntityStub } from './nlp-entity.schema';
import { NlpValueStub } from './nlp-value.schema';

export enum LookupStrategy {
  keywords = 'keywords',
  trait = 'trait',
  free_text = 'free-text',
  pattern = 'pattern',
}

export type Lookup = `${LookupStrategy}`;

export interface NlpSampleEntityValue {
  entity: string; // entity name
  value: string; // entity value
  start?: number;
  end?: number;
}

export type NlpEntityMap<T extends NlpEntityStub> = { [entityId: string]: T };

export type NlpValueMap<T extends NlpValueStub> = { [valueId: string]: T };

export enum NlpSampleState {
  train = 'train',
  test = 'test',
  inbox = 'inbox',
}

export type NlpCacheMap = Map<string, NlpEntityFull>;

export type NlpMetadata = {
  // Required when lookups is "pattern"
  pattern?: string;
  wordBoundary?: boolean;
  removeSpaces?: boolean;
  toLowerCase?: boolean;
  stripDiacritics?: boolean;
};
