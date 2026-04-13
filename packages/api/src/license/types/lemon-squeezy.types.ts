/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LicenseStatus } from './license-feature.enum';

export type LemonSqueezyLicenseKey = {
  id: number;
  status: LicenseStatus;
  key: string;
  activation_limit: number | null;
  activation_usage: number | null;
  created_at: string;
  expires_at: string | null;
};

export type LemonSqueezyLicenseInstance = {
  id: string;
  name: string;
  created_at: string;
};

export type LemonSqueezyMeta = {
  store_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_name: string;
  variant_id: number;
  variant_name: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
};

export type LemonSqueezyValidationResponse = {
  valid: boolean;
  error: string | null;
  license_key: LemonSqueezyLicenseKey | null;
  instance?: LemonSqueezyLicenseInstance | null;
  meta?: LemonSqueezyMeta | null;
};

export type LemonSqueezyActivationResponse = {
  activated: boolean;
  error: string | null;
  license_key: LemonSqueezyLicenseKey | null;
  instance?: LemonSqueezyLicenseInstance | null;
  meta?: LemonSqueezyMeta | null;
};

export type LemonSqueezyDeactivationResponse = {
  deactivated: boolean;
  error: string | null;
  license_key: LemonSqueezyLicenseKey | null;
  meta?: LemonSqueezyMeta | null;
};
