/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { flatten } from '@hexabot/core/database';

describe('flatten', () => {
  it('should support a nested object with one nested level', () => {
    const object = {
      name: 'name',
      context: { nestedField: 'value' },
    };
    const result = flatten(object);

    expect(result).toStrictEqual({
      name: 'name',
      'context.nestedField': 'value',
    });
  });

  it('should support a nested object with multiple nested levels', () => {
    const object = {
      name: 'name',
      context: {
        nestedField: 'value',
        country: {
          isoCode: 'usa',
          phonePrefix: '+1',
          countryName: 'United States',
        },
      },
    };
    const result = flatten(object);

    expect(result).toStrictEqual({
      name: 'name',
      'context.nestedField': 'value',
      'context.country.isoCode': 'usa',
      'context.country.phonePrefix': '+1',
      'context.country.countryName': 'United States',
    });
  });

  it('should support object with flattened keys', () => {
    const object = {
      'user.name': {
        id: 'Alice',
      },
      nested: {
        'country.name': 'France',
      },
    };
    const result = flatten(object);

    expect(result).toStrictEqual({
      'nested.country.name': 'France',
      'user.name.id': 'Alice',
    });
  });

  it('should support custom prefix', () => {
    const object = {
      isoCode: 'tun',
      phonePrefix: '+216',
      countryName: 'Tunisia',
    };
    const result = flatten(object, 'context.country');

    expect(result).toStrictEqual({
      'context.country.isoCode': 'tun',
      'context.country.phonePrefix': '+216',
      'context.country.countryName': 'Tunisia',
    });
  });

  it('should support custom static initial value', () => {
    const object = {
      context: {
        country: { isoCode: 'fra', phonePrefix: '+33', countryName: 'France' },
      },
    };
    const result = flatten(object, undefined, { language: 'fr' });

    expect(result).toStrictEqual({
      language: 'fr',
      'context.country.isoCode': 'fra',
      'context.country.phonePrefix': '+33',
      'context.country.countryName': 'France',
    });
  });

  it('should handle arrays as values without recursing into them', () => {
    const object = {
      items: [1, 2, 3],
      nested: {
        moreItems: [4, 5, 6],
        deepNested: {
          evenMoreItems: [7, 8, 9],
        },
      },
    };
    const result = flatten(object);

    expect(result).toStrictEqual({
      items: [1, 2, 3],
      'nested.moreItems': [4, 5, 6],
      'nested.deepNested.evenMoreItems': [7, 8, 9],
    });
  });

  it('should support an object without nested object', () => {
    const object = {
      name: 'name',
    };
    const result = flatten(object);

    expect(result).toStrictEqual({
      name: 'name',
    });
  });

  it('should support data including a date', () => {
    const object = {
      name: 'name',
      date1: new Date('1900-01-01'),
      context: { nestedField: 'value', date2: new Date('1900-01-02') },
    };
    const result = flatten(object);

    expect(result).toStrictEqual({
      name: 'name',
      date1: new Date('1900-01-01'),
      'context.nestedField': 'value',
      'context.date2': new Date('1900-01-02'),
    });
  });

  it('should support an empty object', () => {
    const result = flatten({});

    expect(result).toStrictEqual({});
  });

  it('should throw an error if data is an array', () => {
    expect(() => flatten([])).toThrow('Data should be an object!');
  });
});
