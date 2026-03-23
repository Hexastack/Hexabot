/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, Type } from '@nestjs/common';

import { BaseSettingGroupProvider } from '@/setting/base-setting-group';
import {
  RuntimeSettingGroupDescriptor,
  RuntimeSettingGroupSchema,
} from '@/setting/runtime-settings';
import { RuntimeSettingsService } from '@/setting/runtime-settings.service';

export function createSettingGroup<
  G extends string,
  S extends RuntimeSettingGroupSchema,
>(
  params: RuntimeSettingGroupDescriptor<G, S>,
): Type<BaseSettingGroupProvider<G, S>> {
  @Injectable()
  class FnSettingGroupProvider extends BaseSettingGroupProvider<G, S> {
    constructor(runtimeSettingsService: RuntimeSettingsService) {
      super(params, runtimeSettingsService);
    }
  }

  return FnSettingGroupProvider;
}
