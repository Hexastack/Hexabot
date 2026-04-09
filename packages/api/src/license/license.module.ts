/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';

import { SettingModule } from '@/setting/setting.module';

import { LicenseFeatureGuard } from './guards/license-feature.guard';
import { LemonSqueezyService } from './services/lemon-squeezy.service';
import { LicenseService } from './services/license.service';

@Global()
@Module({
  imports: [HttpModule, SettingModule],
  providers: [LicenseService, LicenseFeatureGuard, LemonSqueezyService],
  exports: [LicenseService, LicenseFeatureGuard],
})
export class LicenseModule {}
