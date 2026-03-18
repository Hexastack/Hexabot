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

import { DEFAULT_ALLOWED_UPLOAD_TYPES } from '../web/settings';

export const CONSOLE_CHANNEL_NAME = 'console-channel';

export const CONSOLE_CHANNEL_NAMESPACE = 'console_channel';

export const consoleChannelSettingsSchema = z
  .object({
    allowed_domains: csvStringToArray,
    start_button: z.boolean(),
    input_disabled: z.boolean(),
    persistent_menu: z.boolean(),
    greeting_message: z.string(),
    show_emoji: z.boolean(),
    show_file: z.boolean(),
    show_location: z.boolean(),
    allowed_upload_types: csvStringToArray,
  })
  .strict();

export type ConsoleChannelSettings = z.infer<
  typeof consoleChannelSettingsSchema
>;

export const CONSOLE_CHANNEL_SETTING_FIELDS = {
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
} as const satisfies Record<
  keyof ConsoleChannelSettings,
  SettingFieldDefinition
>;

export const settingsSchema = consoleChannelSettingsSchema;

const CONSOLE_CHANNEL_SETTINGS = Object.entries(
  CONSOLE_CHANNEL_SETTING_FIELDS,
).map(([label, definition]) => ({
  group: CONSOLE_CHANNEL_NAMESPACE,
  label,
  ...definition,
})) satisfies ChannelSetting<typeof CONSOLE_CHANNEL_NAME>[];

export default CONSOLE_CHANNEL_SETTINGS;
