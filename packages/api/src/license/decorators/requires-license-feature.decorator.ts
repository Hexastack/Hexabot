/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';

import { LicenseFeatureGuard } from '../guards/license-feature.guard';
import { LicenseFeature } from '../types/license-feature.enum';

export const LICENSE_FEATURE_METADATA_KEY = 'license:features';

export const RequiresLicenseFeature = (...features: LicenseFeature[]) =>
  applyDecorators(
    SetMetadata(LICENSE_FEATURE_METADATA_KEY, features),
    UseGuards(LicenseFeatureGuard),
  );
