/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { LicenseQuotaSnapshot } from './license-quota';

export enum LicenseFeature {
  UserManagement = 'user_management',
}

export const ALL_LICENSE_FEATURES: readonly LicenseFeature[] = Object.freeze([
  LicenseFeature.UserManagement,
]);

export const LICENSE_FEATURE_LABELS: Record<LicenseFeature, string> = {
  [LicenseFeature.UserManagement]: 'user management',
};

export type LicenseStatus =
  | 'inactive'
  | 'active'
  | 'expired'
  | 'disabled'
  | 'invalid'
  | 'undefined'
  | 'error';

export type LicensePlan = 'starter' | 'pro' | 'unlimited' | 'unknown';

export type PaidPlan = Exclude<LicensePlan, 'unknown'>;

export const LICENSE_PLAN_RANK: Record<LicensePlan, number> = {
  unknown: 0,
  starter: 1,
  pro: 2,
  unlimited: 3,
};

export const FEATURE_MIN_PLAN: Record<LicenseFeature, PaidPlan> = {
  [LicenseFeature.UserManagement]: 'pro',
};

export type LicenseSnapshot = {
  status: LicenseStatus;
  plan: LicensePlan;
  activationLimit: number | null;
  activationUsage: number | null;
  lastError: string | null;
  quotas: LicenseQuotaSnapshot;
};
