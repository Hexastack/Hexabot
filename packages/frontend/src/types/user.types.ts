/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  User as SharedUser,
  UserFull as SharedUserFull,
  UserStub as SharedUserStub,
} from "@hexabot-ai/types";

export type LicensePlan = "unknown" | "starter" | "pro" | "unlimited";

export type PaidLicensePlan = Exclude<LicensePlan, "unknown">;

export type LicenseStatus =
  | "inactive"
  | "active"
  | "expired"
  | "disabled"
  | "invalid"
  | "undefined"
  | "error";

export type LicenseQuotaTier = "community" | PaidLicensePlan;

export type LicenseQuotaResource = "users" | "workflows";

export interface ILicenseQuotaResourceState {
  limit: number | null;
  used: number;
  remaining: number | null;
  reached: boolean;
}

export interface ILicenseQuotas {
  tier: LicenseQuotaTier;
  resources: Record<LicenseQuotaResource, ILicenseQuotaResourceState>;
}

export interface ILicense {
  activationLimit: number | null;
  activationUsage: number | null;
  plan: LicensePlan;
  status: LicenseStatus;
  lastError: string | null;
  quotas: ILicenseQuotas;
}

export type IUserAttributes = Pick<
  SharedUser,
  "firstName" | "lastName" | "email" | "state" | "roles" | "avatar" | "language"
> & {
  password?: string;
  license?: ILicense;
};

export type UserStub = SharedUserStub & {
  fullName?: string;
  license?: ILicense;
};

export interface IProfileAttributes extends Partial<UserStub> {
  password?: string;
  password2?: string;
  avatar?: File | null;
}

export type User = SharedUser & {
  fullName?: string;
  license?: ILicense;
};

export type UserFull = SharedUserFull & {
  fullName?: string;
  license?: ILicense;
};
