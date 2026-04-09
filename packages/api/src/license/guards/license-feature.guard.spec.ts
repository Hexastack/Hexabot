/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { LicenseService } from '../services/license.service';
import { LicenseFeature } from '../types/license-feature.enum';

import { LicenseFeatureGuard } from './license-feature.guard';

describe('LicenseFeatureGuard', () => {
  const context = {
    getHandler: () => Symbol('handler'),
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const licenseServiceMock = {
    hasFeature: jest.fn(),
    getLastError: jest.fn(),
  } as unknown as LicenseService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows execution when no feature metadata is present', async () => {
    (reflectorMock.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const guard = new LicenseFeatureGuard(reflectorMock, licenseServiceMock);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('allows execution when all required features are enabled', async () => {
    (reflectorMock.getAllAndOverride as jest.Mock).mockReturnValue([
      LicenseFeature.UserManagement,
    ]);
    (licenseServiceMock.hasFeature as jest.Mock).mockReturnValue(true);

    const guard = new LicenseFeatureGuard(reflectorMock, licenseServiceMock);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(licenseServiceMock.hasFeature).toHaveBeenCalledWith(
      LicenseFeature.UserManagement,
    );
  });

  it('throws a forbidden exception when a feature is disabled', async () => {
    (reflectorMock.getAllAndOverride as jest.Mock).mockReturnValue([
      LicenseFeature.UserManagement,
    ]);
    (licenseServiceMock.hasFeature as jest.Mock).mockReturnValue(false);
    (licenseServiceMock.getLastError as jest.Mock).mockReturnValue(
      'License is not active',
    );

    const guard = new LicenseFeatureGuard(reflectorMock, licenseServiceMock);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
