import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { SettingType } from '@/setting/schemas/types';

import BaseHelper from './BaseHelper';
import BaseLlmHelper from './BaseLlmHelper';
import BaseNlpHelper from './BaseNlpHelper';

export enum HelperType {
  NLU = 'nlu',
  LLM = 'llm',
}

export type TypeOfHelper<T> = T extends HelperType.LLM
  ? BaseLlmHelper
  : T extends HelperType.NLU
    ? BaseNlpHelper
    : BaseHelper;

export type HelperRegistry<H extends BaseHelper = BaseHelper> = Map<
  HelperType,
  Map<string, H>
> & {
  get<T extends HelperType>(type: T): Map<string, TypeOfHelper<T>> | undefined;
};

export type HelperSetting = SettingCreateDto;
