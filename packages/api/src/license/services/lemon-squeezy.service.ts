/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';

import {
  LemonSqueezyActivationResponse,
  LemonSqueezyDeactivationResponse,
  LemonSqueezyValidationResponse,
} from '../types/lemon-squeezy.types';

export const LEMON_SQUEEZY_API_BASE_URL = 'https://api.lemonsqueezy.com';

@Injectable()
export class LemonSqueezyService {
  constructor(private readonly httpService: HttpService) {}

  async validate(licenseKey: string, instanceId?: string) {
    const { data, status } =
      await this.httpService.axiosRef.post<LemonSqueezyValidationResponse>(
        `${LEMON_SQUEEZY_API_BASE_URL}/v1/licenses/validate`,
        { license_key: licenseKey, instance_id: instanceId },
        {
          headers: {
            Accept: 'application/json',
          },
          // Lemon Squeezy can return 4xx with a structured validation payload.
          // Treat those as domain responses instead of transport failures.
          validateStatus: (responseStatus) =>
            responseStatus >= 200 && responseStatus < 500,
        },
      );

    if (typeof data?.valid !== 'boolean') {
      throw new Error(
        `Unexpected license validation response from Lemon Squeezy (status=${status}).`,
      );
    }

    return data;
  }

  async activate(licenseKey: string) {
    const { data } =
      await this.httpService.axiosRef.post<LemonSqueezyActivationResponse>(
        `${LEMON_SQUEEZY_API_BASE_URL}/v1/licenses/activate`,
        {
          license_key: licenseKey,
          instance_name: randomUUID(),
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

    return data;
  }

  async deactivate(licenseKey: string, instanceId: string) {
    const { data } =
      await this.httpService.axiosRef.post<LemonSqueezyDeactivationResponse>(
        `${LEMON_SQUEEZY_API_BASE_URL}/v1/licenses/deactivate`,
        {
          license_key: licenseKey,
          instance_id: instanceId,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

    return data;
  }

  extractAxiosError(error: unknown): string {
    if (error instanceof AxiosError) {
      const details =
        typeof error.response?.data === 'object' && error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;

      return `License API call failed: ${details}`;
    }

    if (error instanceof Error) {
      return `License API call failed: ${error.message}`;
    }

    return 'License API call failed due to an unknown error';
  }
}
