import { SettingCreateDto } from '@/setting/dto/setting.dto';

import BaseHelper from './lib/base-helper';
import BaseLlmHelper from './lib/base-llm-helper';
import BaseNlpHelper from './lib/base-nlp-helper';

export namespace Nlp {
  export interface Config {
    endpoint?: string;
    token: string;
  }

  export interface ParseEntity {
    entity: string; // Entity name
    value: string; // Value name
    confidence: number;
    start?: number;
    end?: number;
  }

  export interface ParseEntities {
    entities: ParseEntity[];
  }
}

export enum HelperType {
  NLU = 'nlu',
  LLM = 'llm',
  UTIL = 'util',
}

export type TypeOfHelper<T extends HelperType> = T extends HelperType.LLM
  ? BaseLlmHelper<string>
  : T extends HelperType.NLU
    ? BaseNlpHelper<string>
    : BaseHelper;

export type HelperRegistry<H extends BaseHelper = BaseHelper> = Map<
  HelperType,
  Map<string, H>
>;

export type HelperSetting<N extends string = string> = Omit<
  SettingCreateDto,
  'group' | 'weight'
> & {
  group: HyphenToUnderscore<N>;
};
