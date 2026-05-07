/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DiscoveryService } from '@nestjs/core';

import { WorkflowTransferAdapterRegistry } from './workflow-transfer-adapter.registry';
import {
  WorkflowTransferAdapter,
  type WorkflowTransferExportContext,
  type WorkflowTransferImportContext,
  WorkflowTransferResourceAdapter,
} from './workflow-transfer-resource-adapter';
import { WorkflowTransferImportAdapterResult } from './workflow-transfer.types';

@WorkflowTransferAdapter()
class TestTransferAdapter extends WorkflowTransferResourceAdapter {
  override readonly kind: string;

  override readonly resourceKeys: readonly string[];

  override readonly dependsOn: readonly string[];

  constructor(
    kind: string,
    resourceKeys: readonly string[],
    dependsOn: readonly string[] = [],
  ) {
    super();
    this.kind = kind;
    this.resourceKeys = resourceKeys;
    this.dependsOn = dependsOn;
  }

  override async buildExportResources(
    _ctx: WorkflowTransferExportContext,
  ): Promise<Record<string, unknown[]>> {
    return {};
  }

  override async importResources(
    _ctx: WorkflowTransferImportContext,
  ): Promise<WorkflowTransferImportAdapterResult> {
    return {
      idMap: {},
      resources: [],
      warnings: [],
      postCreateEvents: [],
    };
  }
}

const buildRegistry = (
  adapters: WorkflowTransferResourceAdapter[],
): WorkflowTransferAdapterRegistry => {
  const discoveryService = {
    getProviders: () =>
      adapters.map((adapter) => ({
        instance: adapter,
        metatype: adapter.constructor,
        name: adapter.constructor.name,
      })),
  } as unknown as DiscoveryService;

  return new WorkflowTransferAdapterRegistry(discoveryService);
};

describe('WorkflowTransferAdapterRegistry', () => {
  it('lists adapters in dependency order and reverse dependency order', () => {
    const credential = new TestTransferAdapter('credential', ['credentials']);
    const mcpServer = new TestTransferAdapter(
      'mcpServer',
      ['mcpServers'],
      ['credential'],
    );
    const label = new TestTransferAdapter('label', ['labels', 'labelGroups']);
    const registry = buildRegistry([mcpServer, credential, label]);

    expect(
      registry.listInDependencyOrder().map((adapter) => adapter.kind),
    ).toEqual(['credential', 'mcpServer', 'label']);
    expect(
      registry.listInReverseDependencyOrder().map((adapter) => adapter.kind),
    ).toEqual(['label', 'mcpServer', 'credential']);
  });

  it('looks up adapters by kind and resource key', () => {
    const adapter = new TestTransferAdapter('contentType', ['contentTypes']);
    const registry = buildRegistry([adapter]);

    expect(registry.get('contentType')).toBe(adapter);
    expect(registry.getByResourceKey('contentTypes')).toBe(adapter);
    expect(registry.getResourceKeys()).toEqual(['contentTypes']);
  });

  it('rejects duplicate adapter kinds', () => {
    const registry = buildRegistry([
      new TestTransferAdapter('credential', ['credentials']),
      new TestTransferAdapter('credential', ['otherCredentials']),
    ]);

    expect(() => registry.listInDependencyOrder()).toThrow(
      /Duplicate workflow transfer adapter kind "credential"/,
    );
  });

  it('rejects duplicate resource keys', () => {
    const registry = buildRegistry([
      new TestTransferAdapter('credential', ['credentials']),
      new TestTransferAdapter('secret', ['credentials']),
    ]);

    expect(() => registry.listInDependencyOrder()).toThrow(
      /Duplicate workflow transfer resource key "credentials"/,
    );
  });

  it('rejects unknown dependencies', () => {
    const registry = buildRegistry([
      new TestTransferAdapter('mcpServer', ['mcpServers'], ['credential']),
    ]);

    expect(() => registry.listInDependencyOrder()).toThrow(
      /depends on unknown adapter "credential"/,
    );
  });

  it('rejects dependency cycles', () => {
    const registry = buildRegistry([
      new TestTransferAdapter('a', ['aResources'], ['b']),
      new TestTransferAdapter('b', ['bResources'], ['a']),
    ]);

    expect(() => registry.listInDependencyOrder()).toThrow(
      /dependency cycle: a -> b -> a/,
    );
  });
});
