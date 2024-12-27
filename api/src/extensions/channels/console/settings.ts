/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ChannelSetting } from '@/channel/types';
import { config } from '@/config';
import { SettingType } from '@/setting/schemas/types';

export const CONSOLE_CHANNEL_NAME = 'console-channel';

export const CONSOLE_CHANNEL_NAMESPACE = 'console_channel';

export default [
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'allowed_domains',
    value: config.security.cors.allowOrigins.join(','),
    type: SettingType.text,
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'start_button',
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'input_disabled',
    value: false,
    type: SettingType.checkbox,
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'persistent_menu',
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'greeting_message',
    value: 'Welcome! Ready to start a conversation with our chatbot?',
    type: SettingType.textarea,
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'theme_color',
    value: 'teal',
    type: SettingType.select,
    options: ['teal', 'orange', 'red', 'green', 'blue', 'dark'],
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'show_emoji',
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'show_file',
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'show_location',
    value: true,
    type: SettingType.checkbox,
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'allowed_upload_types',
    value:
      'audio/mpeg,audio/x-ms-wma,audio/vnd.rn-realaudio,audio/x-wav,image/gif,image/jpeg,image/png,image/tiff,image/vnd.microsoft.icon,image/vnd.djvu,image/svg+xml,text/css,text/csv,text/html,text/plain,text/xml,video/mpeg,video/mp4,video/quicktime,video/x-ms-wmv,video/x-msvideo,video/x-flv,video/web,application/msword,application/vnd.ms-powerpoint,application/pdf,application/vnd.ms-excel,application/vnd.oasis.opendocument.presentation,application/vnd.oasis.opendocument.tex,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.graphics,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    type: SettingType.textarea,
  },
] as const satisfies ChannelSetting<typeof CONSOLE_CHANNEL_NAME>[];
