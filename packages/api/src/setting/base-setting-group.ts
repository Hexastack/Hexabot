/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';

import {
  RuntimeSettingGroupDescriptor,
  RuntimeSettingGroupSchema,
  SettingExtensionType,
  SettingScope,
} from '@/setting/runtime-settings';
import { RuntimeSettingsService } from '@/setting/services/runtime-settings.service';

@Injectable()
export abstract class BaseSettingGroupProvider<
  G extends string = string,
  S extends RuntimeSettingGroupSchema = RuntimeSettingGroupSchema,
> implements OnModuleInit
{
  public readonly group: G;

  public readonly schema: S;

  public readonly scope: SettingScope;

  public readonly extensionType?: SettingExtensionType;

  public readonly extensionName?: string;

  private readonly runtimeSettingsService: RuntimeSettingsService;

  protected constructor(
    metadata: RuntimeSettingGroupDescriptor<G, S>,
    runtimeSettingsService: RuntimeSettingsService,
  ) {
    this.runtimeSettingsService = runtimeSettingsService;
    this.group = metadata.group;
    this.schema = metadata.schema;
    this.scope = metadata.scope;
    this.extensionType = metadata.extensionType;
    this.extensionName = metadata.extensionName;
  }

  onModuleInit() {
    this.runtimeSettingsService.register({
      group: this.group,
      schema: this.schema,
      scope: this.scope,
      extensionType: this.extensionType,
      extensionName: this.extensionName,
    });
  }
}
