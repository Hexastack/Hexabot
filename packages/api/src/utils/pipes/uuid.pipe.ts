/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

/**
 * Validates UUID route parameters by automatically checking parameters named `id`
 * (or starting with `id`), whether they come as a
 * single value or inside an object of params (e.g. multiple route params).
 */
@Injectable()
export class UuidPipe implements PipeTransform {
  private static readonly DEFAULT_ALLOWED_VERSIONS = new Set([4]);

  constructor(
    private readonly allowedVersions = UuidPipe.DEFAULT_ALLOWED_VERSIONS,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'param') {
      return value;
    }

    if (typeof value === 'string' && this.shouldValidate(metadata.data)) {
      this.ensureUuid(value, metadata.data ?? 'parameter');
    } else if (value && typeof value === 'object') {
      for (const [param, paramValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (this.shouldValidate(param)) {
          this.ensureUuid(String(paramValue), param);
        }
      }
    }

    return value;
  }

  private shouldValidate(paramName?: string): boolean {
    if (!paramName) {
      return false;
    }
    const lowered = paramName.toLowerCase();
    return lowered === 'id' || lowered.startsWith('id');
  }

  private ensureUuid(rawValue: string, paramName: string): void {
    const candidate = rawValue.trim();
    if (!uuidValidate(candidate)) {
      throw new BadRequestException(
        `Invalid UUID supplied for "${paramName}".`,
      );
    }

    const version = uuidVersion(candidate);
    if (!this.allowedVersions.has(version)) {
      throw new BadRequestException(
        `Unsupported UUID version (${version}) supplied for "${paramName}".`,
      );
    }
  }
}
