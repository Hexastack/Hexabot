/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Logger } from '@nestjs/common';

import { TSearchFilterValue } from '../types/filter.types';

import { SearchFilterPipe } from './search-filter.pipe';

type PipeTest = {
  name: string;
  email: string;
  id: string;
  roles: string[];
  status: string;
};

jest.mock('@nestjs/common', () => ({
  ...(jest.requireActual('@nestjs/common') as Record<string, unknown>),
  Logger: {
    warn: jest.fn(),
  },
}));

describe('SearchFilterPipe', () => {
  const allowedFields = [
    'name',
    'email',
    'id',
    'status',
    'roles',
  ] as (keyof PipeTest)[];

  const pipe = new SearchFilterPipe<PipeTest>({
    allowedFields,
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should transform a simple "where" query correctly', async () => {
    const input = {
      where: {
        name: 'John Doe',
        email: { contains: 'example' },
      },
    };

    const result = await pipe.transform(input, {} as any);

    expect(result).toEqual({
      $and: [{ name: 'John Doe' }, { email: /example/i }],
    });
  });

  it('should handle "or" queries correctly', async () => {
    const input = {
      where: {
        or: [{ name: 'John Doe' }, { email: { contains: 'example' } }],
      },
    };

    const result = await pipe.transform(input, {} as any);

    expect(result).toEqual({
      $or: [{ name: 'John Doe' }, { email: /example/i }],
    });
  });

  it('should filter out disallowed fields', async () => {
    const input = {
      where: {
        name: 'John Doe',
        secret: 'top-secret', // Disallowed field
      },
    } as TSearchFilterValue<PipeTest>;

    const result = await pipe.transform(input, {} as any);

    expect(result).toEqual({
      $and: [{ name: 'John Doe' }],
    });

    expect(Logger.warn).toHaveBeenCalledWith('Field secret is not allowed');
  });

  it('should transform "id" field into ObjectId when valid', async () => {
    const oid = '9'.repeat(24);
    const input = {
      where: {
        id: oid,
      },
    };

    const result = await pipe.transform(input, {} as any);

    expect(result).toEqual({
      $and: [{ _id: oid }],
    });
  });

  it('should skip "id" field if it is not a valid ObjectId', async () => {
    const input = {
      where: {
        id: 'invalid-id',
      },
    };

    const result = await pipe.transform(input, {} as any);

    expect(result).toEqual({});
  });

  it('should handle null values properly', async () => {
    const input = {
      where: {
        name: 'null',
      },
    };

    const result = await pipe.transform(input, {} as any);

    expect(result).toEqual({
      $and: [{ name: undefined }],
    });
  });

  it('should handle "!=" operator correctly', async () => {
    const input = {
      where: {
        status: { '!=': 'inactive' },
      },
    };

    const result = await pipe.transform(input, {} as any);

    expect(result).toEqual({
      $nor: [{ status: 'inactive' }],
    });
  });

  it('should handle "in" operator correctly', async () => {
    const input = {
      where: {
        roles: ['1', '2'],
      },
    };

    const result = await pipe.transform(input, {} as any);

    expect(result).toEqual({
      $and: [{ roles: ['1', '2'] }],
    });
  });
});
