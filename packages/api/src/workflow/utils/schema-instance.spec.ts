/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JSONSchema7 } from 'json-schema';

import { FieldInfo, SchemaInstance } from './schema-instance';

const buildFieldMap = (fields: FieldInfo[]) =>
  fields.reduce<Record<string, FieldInfo>>((acc, field) => {
    acc[field.path] = field;

    return acc;
  }, {});

describe('SchemaInstance', () => {
  describe('fields', () => {
    it('iterates schema properties with required flags and title fallback', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            title: 'User ID',
            description: 'Unique identifier.',
          },
          email: {
            type: 'string',
            title: 'Email',
            description: 'Used for login.',
          },
          optional: { type: 'number' },
        },
        required: ['id', 'email'],
      };
      const data = {
        id: 'u_123',
        email: 'a@b.com',
        optional: 7,
        extraKey: 123,
      };
      const instance = new SchemaInstance(schema, data);
      const fields = Array.from(instance.fields());
      const byPath = buildFieldMap(fields);

      expect(fields.map((field) => field.name)).toEqual([
        'id',
        'email',
        'optional',
      ]);
      expect(byPath.id).toMatchObject({
        name: 'id',
        path: 'id',
        title: 'User ID',
        description: 'Unique identifier.',
        value: 'u_123',
        required: true,
      });
      expect(byPath.email).toMatchObject({
        name: 'email',
        path: 'email',
        title: 'Email',
        description: 'Used for login.',
        value: 'a@b.com',
        required: true,
      });
      expect(byPath.optional).toMatchObject({
        name: 'optional',
        path: 'optional',
        title: 'optional',
        value: 7,
        required: false,
      });
      expect(byPath.extraKey).toBeUndefined();
    });

    it('includes additional data keys when includeAdditional is true', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          optional: { type: 'number' },
        },
      };
      const data = {
        id: 'u_123',
        email: 'a@b.com',
        optional: 7,
        extraKey: 123,
      };
      const instance = new SchemaInstance(schema, data);
      const fields = Array.from(instance.fields({ includeAdditional: true }));
      const byPath = buildFieldMap(fields);

      expect(fields.map((field) => field.name)).toEqual([
        'id',
        'email',
        'optional',
        'extraKey',
      ]);
      expect(byPath.extraKey).toMatchObject({
        name: 'extraKey',
        path: 'extraKey',
        title: 'extraKey',
        value: 123,
        required: false,
      });
    });

    it('recursively iterates nested object fields and resolves $ref/allOf', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          profile: { $ref: '#/$defs/profile' },
          meta: {
            allOf: [
              { title: 'Metadata', description: 'Extra info' },
              {
                type: 'object',
                properties: {
                  active: { type: 'boolean', title: 'Active' },
                },
                required: ['active'],
              },
            ],
          },
          list: {
            type: 'object',
            properties: { value: { type: 'string' } },
          },
        },
        required: ['profile'],
        $defs: {
          profile: {
            type: 'object',
            title: 'Profile',
            properties: {
              firstName: { type: 'string', title: 'First name' },
              lastName: { type: 'string', description: 'Last name' },
            },
            required: ['firstName'],
          },
        },
      };
      const data = {
        profile: { firstName: 'Ada', lastName: 'Lovelace' },
        meta: { active: true },
        list: [],
      };
      const instance = new SchemaInstance(schema, data);
      const fields = Array.from(instance.fields({ recursive: true }));
      const byPath = buildFieldMap(fields);

      expect(fields).toHaveLength(6);
      expect(byPath.profile).toMatchObject({
        name: 'profile',
        path: 'profile',
        title: 'Profile',
        value: data.profile,
        required: true,
      });
      expect(byPath.profile.schema.properties?.firstName).toBeDefined();
      expect(byPath['profile.firstName']).toMatchObject({
        name: 'firstName',
        path: 'profile.firstName',
        title: 'First name',
        value: 'Ada',
        required: true,
      });
      expect(byPath['profile.lastName']).toMatchObject({
        name: 'lastName',
        path: 'profile.lastName',
        title: 'lastName',
        description: 'Last name',
        value: 'Lovelace',
        required: false,
      });
      expect(byPath.meta).toMatchObject({
        name: 'meta',
        path: 'meta',
        title: 'Metadata',
        description: 'Extra info',
        value: data.meta,
        required: false,
      });
      expect(byPath['meta.active']).toMatchObject({
        name: 'active',
        path: 'meta.active',
        title: 'Active',
        value: true,
        required: true,
      });
      expect(byPath.list).toMatchObject({
        name: 'list',
        path: 'list',
        value: data.list,
      });
      expect(byPath['list.value']).toBeUndefined();
    });

    it('resolves local $ref with escaped pointer segments', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          complex: { $ref: '#/$defs/foo~1bar~0baz' },
        },
        $defs: {
          'foo/bar~baz': {
            type: 'string',
            title: 'Complex',
          },
        },
      };
      const data = { complex: 'value' };
      const instance = new SchemaInstance(schema, data);
      const fields = Array.from(instance.fields());

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'complex',
        path: 'complex',
        title: 'Complex',
        value: 'value',
      });
    });
  });

  describe('getValue', () => {
    it('returns nested values and undefined for missing paths', () => {
      const schema: JSONSchema7 = { type: 'object' };
      const data = {
        id: 'u_1',
        profile: { firstName: 'Ada' },
      };
      const instance = new SchemaInstance(schema, data);

      expect(instance.getValue('')).toBe(data);
      expect(instance.getValue('profile.firstName')).toBe('Ada');
      expect(instance.getValue('profile.lastName')).toBeUndefined();
      expect(instance.getValue('profile.firstName.extra')).toBeUndefined();
      expect(instance.getValue('missing.path')).toBeUndefined();
    });
  });
});
