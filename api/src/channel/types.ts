import { SettingCreateDto } from '@/setting/dto/setting.dto';

export type ChannelSetting<N extends string = string> = Omit<
  SettingCreateDto,
  'group' | 'weight'
> & {
  group: HyphenToUnderscore<N>;
};
