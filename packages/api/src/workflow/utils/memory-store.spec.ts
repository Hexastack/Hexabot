/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MemoryDefinition, MemoryRecordFull } from '@hexabot-ai/types';

import type { WorkflowRuntimeContext } from '../contexts/workflow-runtime.context';
import { MemoryScope, MemoryValue } from '../types';

import { MemoryStore } from './memory-store';

const baseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
  required: ['name'],
  additionalProperties: false,
};
const createDefinition = (
  overrides: Partial<MemoryDefinition> = {},
): MemoryDefinition =>
  ({
    id: overrides.id ?? `def-${overrides.slug ?? 'memory'}`,
    name: overrides.name ?? 'Test Memory',
    slug: overrides.slug ?? 'memory',
    scope: overrides.scope ?? MemoryScope.global,
    schema: overrides.schema ?? baseSchema,
    ttlSeconds: overrides.ttlSeconds ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  }) as MemoryDefinition;
const createRecord = (
  definition: MemoryDefinition,
  value: MemoryValue,
): MemoryRecordFull =>
  ({
    id: `rec-${definition.slug}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    value,
    definition,
    owner: {} as any,
  }) as MemoryRecordFull;
const createContext = (): WorkflowRuntimeContext =>
  ({ state: {} as any }) as WorkflowRuntimeContext;

describe('MemoryStore', () => {
  describe('createStore', () => {
    it('hydrates raw and instances from valid records', () => {
      const definition = createDefinition({ slug: 'profile' });
      const definitionCache = new Map([[definition.slug, definition]]);
      const record = createRecord(definition, { name: 'Ada' });
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache,
          records: [record],
          upsertRecord: jest.fn(),
        },
        context,
      );

      expect(store.raw).toEqual({ profile: { name: 'Ada' } });
      expect(store.instances.profile.data).toEqual({ name: 'Ada' });
      expect(Object.keys(store)).toEqual([]);
      expect(JSON.stringify(store)).toBe('{}');
      expect(context.state.memory).toEqual({ profile: { name: 'Ada' } });
    });

    it('skips records tied to missing or stale definitions', () => {
      const currentDefinition = createDefinition({
        slug: 'profile',
        id: 'def-current',
      });
      const staleDefinition = createDefinition({
        slug: 'profile',
        id: 'def-stale',
      });
      const missingDefinition = createDefinition({ slug: 'missing' });
      const definitionCache = new Map([
        [currentDefinition.slug, currentDefinition],
      ]);
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache,
          records: [
            createRecord(staleDefinition, { name: 'Stale' }),
            createRecord(missingDefinition, { name: 'Missing' }),
            createRecord(currentDefinition, { name: 'Valid' }),
          ],
          upsertRecord: jest.fn(),
        },
        context,
      );

      expect(store.raw).toEqual({ profile: { name: 'Valid' } });
      expect(context.state.memory).toEqual({ profile: { name: 'Valid' } });
    });

    it('keeps the first record for a duplicate slug', () => {
      const definition = createDefinition({ slug: 'profile' });
      const definitionCache = new Map([[definition.slug, definition]]);
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache,
          records: [
            createRecord(definition, { name: 'Latest' }),
            createRecord(definition, { name: 'Older' }),
          ],
          upsertRecord: jest.fn(),
        },
        context,
      );

      expect(store.raw).toEqual({ profile: { name: 'Latest' } });
      expect(context.state.memory).toEqual({ profile: { name: 'Latest' } });
    });

    it('throws when a memory definition schema is not valid JSON Schema', () => {
      const invalidDefinition = createDefinition({
        slug: 'profile',
        schema: { type: 'wat' } as any,
      });

      expect(() =>
        MemoryStore.createStore(
          {
            identifiers: { ownerId: 'owner-1' },
            definitionCache: new Map([
              [invalidDefinition.slug, invalidDefinition],
            ]),
            records: [],
            upsertRecord: jest.fn(),
          },
          createContext(),
        ),
      ).toThrow();
    });
  });

  describe('buildUpdateMemorySchema', () => {
    it('returns undefined when no definitions exist', () => {
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache: new Map(),
          records: [],
          upsertRecord: jest.fn(),
        },
        context,
      );

      expect(store.buildUpdateMemorySchema()).toBeUndefined();
    });

    it('builds a schema that validates memory values by slug', () => {
      const definition = createDefinition({ slug: 'profile' });
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache: new Map([[definition.slug, definition]]),
          records: [],
          upsertRecord: jest.fn(),
        },
        context,
      );
      const schema = store.buildUpdateMemorySchema();

      expect(schema).toBeDefined();
      if (!schema) {
        throw new Error('Expected buildUpdateMemorySchema to return a schema.');
      }

      expect(
        schema.safeParse({ memory: { profile: { name: 'Ada' } } }).success,
      ).toBe(true);
      expect(schema.safeParse({ memory: {} }).success).toBe(true);
      expect(schema.safeParse({}).success).toBe(false);
      expect(schema.safeParse({ memory: { profile: {} } }).success).toBe(false);
    });
  });

  describe('updateRecord', () => {
    it('throws when owner id is missing', async () => {
      const definition = createDefinition({ slug: 'profile' });
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: '' },
          definitionCache: new Map([[definition.slug, definition]]),
          records: [],
          upsertRecord: jest.fn(),
        },
        context,
      );

      await expect(
        store.updateRecord('profile', { name: 'Ada' }),
      ).rejects.toThrow('An owner id is required to update memory.');
    });

    it('throws when the definition is unknown', async () => {
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache: new Map(),
          records: [],
          upsertRecord: jest.fn(),
        },
        context,
      );

      await expect(
        store.updateRecord('missing', { name: 'Ada' }),
      ).rejects.toThrow('Unknown memory definition "missing".');
    });

    it('throws when workflow-scoped memory lacks workflow id', async () => {
      const definition = createDefinition({
        slug: 'profile',
        scope: MemoryScope.workflow,
      });
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache: new Map([[definition.slug, definition]]),
          records: [],
          upsertRecord: jest.fn(),
        },
        context,
      );

      await expect(
        store.updateRecord('profile', { name: 'Ada' }),
      ).rejects.toThrow(
        'Workflow id is required to update workflow-scoped memory.',
      );
    });

    it('throws when run-scoped memory lacks run id', async () => {
      const definition = createDefinition({
        slug: 'profile',
        scope: MemoryScope.run,
      });
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1', workflowId: 'workflow-1' },
          definitionCache: new Map([[definition.slug, definition]]),
          records: [],
          upsertRecord: jest.fn(),
        },
        context,
      );

      await expect(
        store.updateRecord('profile', { name: 'Ada' }),
      ).rejects.toThrow('Run id is required to update run-scoped memory.');
    });

    it('throws when thread-scoped memory lacks thread id', async () => {
      const definition = createDefinition({
        slug: 'profile',
        scope: MemoryScope.thread,
      });
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache: new Map([[definition.slug, definition]]),
          records: [],
          upsertRecord: jest.fn(),
        },
        context,
      );

      await expect(
        store.updateRecord('profile', { name: 'Ada' }),
      ).rejects.toThrow(
        'Thread id is required to update thread-scoped memory.',
      );
    });

    it('validates values against the schema', async () => {
      const definition = createDefinition({ slug: 'profile' });
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache: new Map([[definition.slug, definition]]),
          records: [],
          upsertRecord: jest.fn(),
        },
        context,
      );

      await expect(store.updateRecord('profile', {})).rejects.toThrow();
    });

    it('persists and updates the in-memory cache', async () => {
      const definition = createDefinition({ slug: 'profile' });
      const persistRecord = jest.fn().mockResolvedValue(undefined);
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: {
            ownerId: 'owner-1',
            workflowId: 'workflow-1',
            runId: 'run-1',
          },
          definitionCache: new Map([[definition.slug, definition]]),
          records: [],
          upsertRecord: persistRecord,
        },
        context,
      );
      const value = { name: 'Updated' };
      const result = await store.updateRecord('profile', value);

      expect(persistRecord).toHaveBeenCalledTimes(1);
      expect(persistRecord).toHaveBeenCalledWith({
        definition,
        ownerId: 'owner-1',
        workflowId: 'workflow-1',
        runId: 'run-1',
        value,
      });
      expect(store.raw.profile).toEqual(value);
      expect(store.instances.profile.data).toEqual(value);
      expect(result).toEqual(value);
      expect(context.state.memory).toEqual({ profile: value });
    });

    it('persists thread-scoped memory with thread identifier', async () => {
      const definition = createDefinition({
        slug: 'conversation',
        scope: MemoryScope.thread,
      });
      const persistRecord = jest.fn().mockResolvedValue(undefined);
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: {
            ownerId: 'owner-1',
            threadId: 'thread-1',
          },
          definitionCache: new Map([[definition.slug, definition]]),
          records: [],
          upsertRecord: persistRecord,
        },
        context,
      );
      const value = { name: 'Thread Memory' };
      const result = await store.updateRecord('conversation', value);

      expect(persistRecord).toHaveBeenCalledWith({
        definition,
        ownerId: 'owner-1',
        workflowId: undefined,
        threadId: 'thread-1',
        runId: undefined,
        value,
      });
      expect(result).toEqual(value);
      expect(store.raw.conversation).toEqual(value);
      expect(context.state.memory).toEqual({ conversation: value });
    });
  });

  describe('update', () => {
    it('returns an empty object without persisting when no values are provided', async () => {
      const definition = createDefinition({ slug: 'profile' });
      const persistRecord = jest.fn().mockResolvedValue(undefined);
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache: new Map([[definition.slug, definition]]),
          records: [],
          upsertRecord: persistRecord,
        },
        context,
      );

      await expect(store.update({})).resolves.toEqual({});
      expect(persistRecord).not.toHaveBeenCalled();
      expect(context.state.memory).toEqual({});
    });

    it('updates entries sequentially and returns normalized results', async () => {
      const profileDefinition = createDefinition({ slug: 'profile' });
      const statsDefinition = createDefinition({
        slug: 'stats',
        schema: {
          type: 'object',
          properties: {
            count: { type: 'number' },
          },
          required: ['count'],
          additionalProperties: false,
        },
      });
      const persistRecord = jest.fn().mockResolvedValue(undefined);
      const context = createContext();
      const store = MemoryStore.createStore(
        {
          identifiers: { ownerId: 'owner-1' },
          definitionCache: new Map([
            [profileDefinition.slug, profileDefinition],
            [statsDefinition.slug, statsDefinition],
          ]),
          records: [],
          upsertRecord: persistRecord,
        },
        context,
      );
      const result = await store.update({
        profile: { name: 'Ada' },
        stats: { count: 2 },
      });

      expect(result).toEqual({
        profile: { name: 'Ada' },
        stats: { count: 2 },
      });
      expect(
        persistRecord.mock.calls.map(([params]) => params.definition.slug),
      ).toEqual(['profile', 'stats']);
      expect(store.raw).toEqual({
        profile: { name: 'Ada' },
        stats: { count: 2 },
      });
      expect(context.state.memory).toEqual({
        profile: { name: 'Ada' },
        stats: { count: 2 },
      });
    });
  });
});
