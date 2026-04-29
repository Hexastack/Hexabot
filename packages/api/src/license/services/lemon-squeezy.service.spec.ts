/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';

import {
  LemonSqueezyActivationResponse,
  LemonSqueezyDeactivationResponse,
  LemonSqueezyValidationResponse,
} from '../types/lemon-squeezy.types';

import {
  LEMON_SQUEEZY_API_BASE_URL,
  LemonSqueezyService,
} from './lemon-squeezy.service';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(),
}));

describe('LemonSqueezyService', () => {
  const randomUUIDMock = jest.requireMock('crypto').randomUUID as jest.Mock;
  const createService = (postImplementation: jest.Mock) => {
    const httpService = {
      axiosRef: {
        post: postImplementation,
      },
    } as unknown as HttpService;

    return new LemonSqueezyService(httpService);
  };

  beforeEach(jest.clearAllMocks);

  describe('validate', () => {
    it('should call the validate endpoint and return response data', async () => {
      const payload: LemonSqueezyValidationResponse = {
        valid: true,
        error: null,
        license_key: null,
      };
      const postSpy = jest.fn().mockResolvedValue({ data: payload });
      const service = createService(postSpy);
      const result = await service.validate('license-key', 'instance-id');

      expect(postSpy).toHaveBeenCalledWith(
        `${LEMON_SQUEEZY_API_BASE_URL}/v1/licenses/validate`,
        {
          license_key: 'license-key',
          instance_id: 'instance-id',
        },
        {
          headers: {
            Accept: 'application/json',
          },
          validateStatus: expect.any(Function),
        },
      );
      expect(result).toBe(payload);
    });

    it('should return invalid payloads from 4xx responses without throwing', async () => {
      const payload: LemonSqueezyValidationResponse = {
        valid: false,
        error: 'license_key not found.',
        license_key: null,
      };
      const postSpy = jest
        .fn()
        .mockResolvedValue({ status: 404, data: payload });
      const service = createService(postSpy);
      const result = await service.validate('invalid-key');

      expect(result).toEqual(payload);
    });

    it('should throw when validation response shape is unexpected', async () => {
      const postSpy = jest
        .fn()
        .mockResolvedValue({ status: 401, data: { message: 'Unauthorized' } });
      const service = createService(postSpy);

      await expect(service.validate('license-key')).rejects.toThrow(
        'Unexpected license validation response from Lemon Squeezy (status=401).',
      );
    });
  });

  describe('deactivate', () => {
    it('should call the deactivate endpoint with the provided identifiers', async () => {
      const payload: LemonSqueezyDeactivationResponse = {
        deactivated: true,
        error: null,
        license_key: null,
      };
      const postSpy = jest.fn().mockResolvedValue({ data: payload });
      const service = createService(postSpy);
      const result = await service.deactivate('license-key', 'instance-id');

      expect(postSpy).toHaveBeenCalledWith(
        `${LEMON_SQUEEZY_API_BASE_URL}/v1/licenses/deactivate`,
        {
          license_key: 'license-key',
          instance_id: 'instance-id',
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );
      expect(result).toBe(payload);
    });
  });

  describe('activate', () => {
    it('should generate an instance name, call the endpoint, and return data', async () => {
      randomUUIDMock.mockReturnValue('generated-instance');
      const payload: LemonSqueezyActivationResponse = {
        activated: true,
        error: null,
        license_key: null,
        instance: null,
      };
      const postSpy = jest.fn().mockResolvedValue({ data: payload });
      const service = createService(postSpy);
      const result = await service.activate('license-key');

      expect(randomUUIDMock).toHaveBeenCalled();
      expect(postSpy).toHaveBeenCalledWith(
        `${LEMON_SQUEEZY_API_BASE_URL}/v1/licenses/activate`,
        {
          license_key: 'license-key',
          instance_name: 'generated-instance',
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );
      expect(result).toBe(payload);
    });
  });

  describe('extractAxiosError', () => {
    it('should stringify response data for Axios errors', () => {
      const response = {
        data: { error: 'invalid-license' },
      } as AxiosResponse;
      const axiosError = new AxiosError(
        'Request failed',
        '400',
        undefined,
        {},
        response,
      );
      const service = createService(jest.fn());
      const message = service.extractAxiosError(axiosError);

      expect(message).toBe(
        'License API call failed: {"error":"invalid-license"}',
      );
    });

    it('should fall back to the error message for Axios errors without object data', () => {
      const response = {
        data: 'unexpected',
      } as AxiosResponse;
      const axiosError = new AxiosError(
        'Service unavailable',
        undefined,
        undefined,
        {},
        response,
      );
      const service = createService(jest.fn());
      const message = service.extractAxiosError(axiosError);

      expect(message).toBe('License API call failed: Service unavailable');
    });

    it('should handle generic errors', () => {
      const service = createService(jest.fn());
      const message = service.extractAxiosError(new Error('Boom'));

      expect(message).toBe('License API call failed: Boom');
    });

    it('should handle unknown error types', () => {
      const service = createService(jest.fn());
      const message = service.extractAxiosError('unexpected value');

      expect(message).toBe('License API call failed due to an unknown error');
    });
  });
});
