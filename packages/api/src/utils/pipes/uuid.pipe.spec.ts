/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException } from '@nestjs/common';

import { UuidPipe } from './uuid.pipe';

describe('UuidPipe', () => {
  let pipe: UuidPipe;

  beforeEach(() => {
    pipe = new UuidPipe();
  });

  it('allows valid v4 UUID params', () => {
    const metadata = { type: 'param', data: 'id' } as any;
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(pipe.transform(uuid, metadata)).toBe(uuid);
  });

  it('rejects non-uuid params', () => {
    const metadata = { type: 'param', data: 'id' } as any;
    expect(() => pipe.transform('not-a-uuid', metadata)).toThrow(
      BadRequestException,
    );
  });

  it('rejects unsupported uuid versions', () => {
    const metadata = { type: 'param', data: 'id' } as any;
    const version1Uuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    expect(() => pipe.transform(version1Uuid, metadata)).toThrow(
      BadRequestException,
    );
  });

  it('validates every matching key in param objects', () => {
    const metadata = { type: 'param', data: undefined } as any;
    const value = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      identifier: '550e8400-e29b-41d4-a716-446655440000',
      notId: 'hello',
    };
    expect(pipe.transform(value, metadata)).toEqual(value);
  });

  it('throws for invalid uuid inside param objects', () => {
    const metadata = { type: 'param', data: undefined } as any;
    const value = { idBot: 'invalid' };
    expect(() => pipe.transform(value, metadata)).toThrow(BadRequestException);
  });

  it('skips non-param metadata types', () => {
    const metadata = { type: 'body', data: 'id' } as any;
    expect(pipe.transform('not-validated', metadata)).toBe('not-validated');
  });
});
