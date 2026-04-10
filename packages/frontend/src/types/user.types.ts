/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IAttachment } from "./attachment.types";
import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { IRole } from "./role.types";

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

export interface IUserAttributes {
  firstName: string;
  lastName: string;
  email: string;
  language: string;
  password?: string;
  state: boolean;
  roles: string[];
  avatar: string | null;
  license?: ILicense;
}

export interface IUserStub
  extends IBaseSchema,
    OmitPopulate<IUserAttributes, EntityType.USER> {
  fullName?: string;
}

export interface IProfileAttributes extends Partial<IUserStub> {
  password2?: string;
  avatar?: File | null;
}

export interface IUser extends IUserStub, IFormat<Format.BASIC> {
  roles: string[]; //populated by default
  avatar: string | null;
}

export interface IUserFull extends IUserStub, IFormat<Format.FULL> {
  roles: IRole[];
  avatar: IAttachment | null;
}
