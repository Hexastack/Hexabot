/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ChannelSetting } from '@/channel/types';
import { SettingType } from '@/setting/schemas/types';

import { Offline } from './types';

export const OFFLINE_CHANNEL_NAME = 'offline' as const;

export const OFFLINE_GROUP_NAME = OFFLINE_CHANNEL_NAME;

export const DEFAULT_OFFLINE_SETTINGS = [
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.verification_token,
    value: 'token123',
    type: SettingType.secret,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.allowed_domains,
    value: 'http://localhost:8080,http://localhost:4000',
    type: SettingType.text,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.start_button,
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.input_disabled,
    value: false,
    type: SettingType.checkbox,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.persistent_menu,
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.greeting_message,
    value: 'Welcome! Ready to start a conversation with our chatbot?',
    type: SettingType.textarea,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.theme_color,
    value: 'teal',
    type: SettingType.select,
    options: ['teal', 'orange', 'red', 'green', 'blue', 'dark'],
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.window_title,
    value: 'Widget Title',
    type: SettingType.text,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.avatar_url,
    value: 'https://eu.ui-avatars.com/api/?name=Hexa+Bot&size=64',
    type: SettingType.text,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.show_emoji,
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.show_file,
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.show_location,
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.allowed_upload_size,
    value: 2500000,
    type: SettingType.number,
  },
  {
    group: OFFLINE_GROUP_NAME,
    label: Offline.SettingLabel.allowed_upload_types,
    value:
      'audio/mpeg,audio/x-ms-wma,audio/vnd.rn-realaudio,audio/x-wav,image/gif,image/jpeg,image/png,image/tiff,image/vnd.microsoft.icon,image/vnd.djvu,image/svg+xml,text/css,text/csv,text/html,text/plain,text/xml,video/mpeg,video/mp4,video/quicktime,video/x-ms-wmv,video/x-msvideo,video/x-flv,video/web,application/msword,application/vnd.ms-powerpoint,application/pdf,application/vnd.ms-excel,application/vnd.oasis.opendocument.presentation,application/vnd.oasis.opendocument.tex,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.graphics,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    type: SettingType.textarea,
  },
] as const satisfies ChannelSetting<typeof OFFLINE_CHANNEL_NAME>[];
