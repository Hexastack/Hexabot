/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { ChannelSetting } from '@/channel/types';
import { config } from '@/config';
import { SettingFieldDefinition } from '@/setting/types';
import { csvStringToArray } from '@/setting/utils/setting-group-definition.utils';

export const WEB_CHANNEL_NAME = 'web-channel' as const;

export const WEB_CHANNEL_NAMESPACE = 'web_channel';

export const DEFAULT_ALLOWED_UPLOAD_TYPES =
  'audio/mpeg,audio/x-ms-wma,audio/vnd.rn-realaudio,audio/x-wav,image/gif,image/jpeg,image/png,image/tiff,image/vnd.microsoft.icon,image/vnd.djvu,image/svg+xml,text/css,text/csv,text/html,text/plain,text/xml,video/mpeg,video/mp4,video/quicktime,video/x-ms-wmv,video/x-msvideo,video/x-flv,video/web,application/msword,application/vnd.ms-powerpoint,application/pdf,application/vnd.ms-excel,application/vnd.oasis.opendocument.presentation,application/vnd.oasis.opendocument.tex,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.graphics,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const webChannelSettingsSchema = z
  .object({
    allowed_domains: csvStringToArray,
    start_button: z.boolean(),
    input_disabled: z.boolean(),
    persistent_menu: z.boolean(),
    greeting_message: z.string(),
    window_title: z.string(),
    avatar_url: z.union([z.literal(''), z.string().url()]),
    show_emoji: z.boolean(),
    show_file: z.boolean(),
    show_location: z.boolean(),
    allowed_upload_types: csvStringToArray,
  })
  .strict();

export type WebChannelSettings = z.infer<typeof webChannelSettingsSchema>;

export const WEB_CHANNEL_SETTING_FIELDS = {
  allowed_domains: {
    schema: {
      type: 'string',
      default: config.security.cors.allowOrigins.join(','),
    },
  },
  start_button: {
    schema: {
      type: 'boolean',
      default: true,
    },
  },
  input_disabled: {
    schema: {
      type: 'boolean',
      default: false,
    },
  },
  persistent_menu: {
    schema: {
      type: 'boolean',
      default: true,
    },
  },
  greeting_message: {
    schema: {
      type: 'string',
      default: 'Welcome! Ready to start chatting with our chatbot?',
      'ui:widget': 'textarea',
      'ui:options': { rows: 5 },
    },
    translatable: true,
  },
  window_title: {
    schema: {
      type: 'string',
      default: 'Widget Title',
    },
    translatable: true,
  },
  avatar_url: {
    schema: {
      type: 'string',
      default: '',
    },
  },
  show_emoji: {
    schema: {
      type: 'boolean',
      default: true,
    },
  },
  show_file: {
    schema: {
      type: 'boolean',
      default: true,
    },
  },
  show_location: {
    schema: {
      type: 'boolean',
      default: true,
    },
  },
  allowed_upload_types: {
    schema: {
      type: 'string',
      default: DEFAULT_ALLOWED_UPLOAD_TYPES,
      'ui:widget': 'textarea',
      'ui:options': { rows: 5 },
    },
  },
} as const satisfies Record<keyof WebChannelSettings, SettingFieldDefinition>;

export const settingsSchema = webChannelSettingsSchema;

const WEB_CHANNEL_SETTINGS = Object.entries(WEB_CHANNEL_SETTING_FIELDS).map(
  ([label, definition]) => ({
    group: WEB_CHANNEL_NAMESPACE,
    label,
    ...definition,
  }),
) satisfies ChannelSetting<typeof WEB_CHANNEL_NAME>[];

export default WEB_CHANNEL_SETTINGS;
