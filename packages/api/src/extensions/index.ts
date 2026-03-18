/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export * from './channels/console/index.channel';

export {
  CONSOLE_CHANNEL_NAME,
  CONSOLE_CHANNEL_NAMESPACE,
  consoleChannelSettingsSchema,
} from './channels/console/settings';

export type { ConsoleChannelSettings } from './channels/console/settings';

export * from './channels/web/base-web-channel';

export * from './channels/web/index.channel';

export {
  DEFAULT_ALLOWED_UPLOAD_TYPES,
  WEB_CHANNEL_NAME,
  WEB_CHANNEL_NAMESPACE,
  webChannelSettingsSchema,
} from './channels/web/settings';

export type { WebChannelSettings } from './channels/web/settings';

export * from './channels/web/types';

export * from './channels/web/wrapper';

export * from './helpers/local-storage/index.helper';

export {
  LOCAL_STORAGE_HELPER_NAME,
  LOCAL_STORAGE_HELPER_NAMESPACE,
  localStorageHelperSettingsSchema,
} from './helpers/local-storage/settings';

export type { LocalStorageHelperSettings } from './helpers/local-storage/settings';

export * from './actions/ai/model.binding';

export * from './actions/ai/tools.binding';

export * from './actions/ai/generate-text.action';

export * from './actions/ai/generate-reply.action';

export * from './actions/ai/generate-object.action';

export * from './actions/ai/infer-object.action';

export * from './actions/messaging/text-message.action';

export * from './actions/messaging/quick-replies.action';

export * from './actions/messaging/buttons.action';

export * from './actions/messaging/attachment.action';

export * from './actions/messaging/list.action';
