import { SettingCreateDto } from '@/setting/dto/setting.dto';

export type ChannelName = `${string}-channel`;

export type ChannelSetting<N extends string = string> = Omit<
  SettingCreateDto,
  'group' | 'weight'
> & {
  group: HyphenToUnderscore<N>;
};
