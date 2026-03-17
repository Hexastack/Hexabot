/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChannelSetting } from '@/channel/types';
import { config } from '@/config';
import {
  createCheckboxSettingSchema,
  createTextSettingSchema,
  createTextareaSettingSchema,
} from '@/setting/utils/setting-schema-definition.utils';

export const CONSOLE_CHANNEL_NAME = 'console-channel';

export const CONSOLE_CHANNEL_NAMESPACE = 'console_channel';

export default [
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'allowed_domains',
    schema: createTextSettingSchema({
      defaultValue: config.security.cors.allowOrigins.join(','),
    }),
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'start_button',
    schema: createCheckboxSettingSchema({ defaultValue: true }),
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'input_disabled',
    schema: createCheckboxSettingSchema({ defaultValue: false }),
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'persistent_menu',
    schema: createCheckboxSettingSchema({ defaultValue: true }),
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'greeting_message',
    schema: createTextareaSettingSchema({
      defaultValue: 'Welcome! Ready to start chatting with our chatbot?',
    }),
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'show_emoji',
    schema: createCheckboxSettingSchema({ defaultValue: true }),
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'show_file',
    schema: createCheckboxSettingSchema({ defaultValue: true }),
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'show_location',
    schema: createCheckboxSettingSchema({ defaultValue: true }),
  },
  {
    group: CONSOLE_CHANNEL_NAMESPACE,
    label: 'allowed_upload_types',
    schema: createTextareaSettingSchema({
      defaultValue:
        'audio/mpeg,audio/x-ms-wma,audio/vnd.rn-realaudio,audio/x-wav,image/gif,image/jpeg,image/png,image/tiff,image/vnd.microsoft.icon,image/vnd.djvu,image/svg+xml,text/css,text/csv,text/html,text/plain,text/xml,video/mpeg,video/mp4,video/quicktime,video/x-ms-wmv,video/x-msvideo,video/x-flv,video/web,application/msword,application/vnd.ms-powerpoint,application/pdf,application/vnd.ms-excel,application/vnd.oasis.opendocument.presentation,application/vnd.oasis.opendocument.tex,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.graphics,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
  },
] as const satisfies ChannelSetting<typeof CONSOLE_CHANNEL_NAME>[];
