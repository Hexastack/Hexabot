/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WORKFLOW_TRANSFER_RESOURCE_KIND_PATTERN } from '@hexabot-ai/types';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';

import {
  WORKFLOW_TRANSFER_ADAPTER_METADATA_KEY,
  WorkflowTransferResourceAdapter,
} from './workflow-transfer-resource-adapter';

type DiscoveredProvider = {
  instance?: unknown;
  metatype?: unknown;
  name?: string;
};

type VisitState = 'visiting' | 'visited';

@Injectable()
export class WorkflowTransferAdapterRegistry implements OnModuleInit {
  private initialized = false;

  private adaptersInDependencyOrder: WorkflowTransferResourceAdapter[] = [];

  private adaptersByKind = new Map<string, WorkflowTransferResourceAdapter>();

  private adaptersByResourceKey = new Map<
    string,
    WorkflowTransferResourceAdapter
  >();

  constructor(private readonly discoveryService: DiscoveryService) {}

  onModuleInit(): void {
    this.ensureInitialized();
  }

  listInDependencyOrder(): WorkflowTransferResourceAdapter[] {
    this.ensureInitialized();

    return [...this.adaptersInDependencyOrder];
  }

  listInReverseDependencyOrder(): WorkflowTransferResourceAdapter[] {
    return [...this.listInDependencyOrder()].reverse();
  }

  get(kind: string): WorkflowTransferResourceAdapter | undefined {
    this.ensureInitialized();

    return this.adaptersByKind.get(kind);
  }

  getByResourceKey(key: string): WorkflowTransferResourceAdapter | undefined {
    this.ensureInitialized();

    return this.adaptersByResourceKey.get(key);
  }

  getResourceKeys(): string[] {
    this.ensureInitialized();

    return Array.from(this.adaptersByResourceKey.keys());
  }

  private ensureInitialized(): void {
    if (this.initialized) {
      return;
    }

    const adapters = this.discoverAdapters();
    this.adaptersByKind = this.buildKindMap(adapters);
    this.adaptersByResourceKey = this.buildResourceKeyMap(adapters);
    this.assertDependenciesExist(adapters);
    this.adaptersInDependencyOrder = this.sortInDependencyOrder(adapters);
    this.initialized = true;
  }

  private discoverAdapters(): WorkflowTransferResourceAdapter[] {
    return this.discoveryService
      .getProviders()
      .flatMap((provider: DiscoveredProvider) => {
        if (!this.hasAdapterMetadata(provider)) {
          return [];
        }

        if (!this.isAdapterInstance(provider.instance)) {
          throw new Error(
            `Workflow transfer adapter provider ${
              provider.name ?? 'unknown'
            } is missing a valid adapter instance`,
          );
        }

        return [provider.instance];
      });
  }

  private hasAdapterMetadata(provider: DiscoveredProvider): boolean {
    const metatype =
      typeof provider.metatype === 'function' ? provider.metatype : null;
    const instanceConstructor =
      provider.instance && typeof provider.instance === 'object'
        ? provider.instance.constructor
        : null;

    return [metatype, instanceConstructor].some(
      (target) =>
        !!target &&
        Reflect.getMetadata(WORKFLOW_TRANSFER_ADAPTER_METADATA_KEY, target) ===
          true,
    );
  }

  private isAdapterInstance(
    value: unknown,
  ): value is WorkflowTransferResourceAdapter {
    return (
      typeof value === 'object' &&
      value !== null &&
      'kind' in value &&
      'resourceKeys' in value &&
      'buildExportResources' in value &&
      'importResources' in value
    );
  }

  private buildKindMap(
    adapters: WorkflowTransferResourceAdapter[],
  ): Map<string, WorkflowTransferResourceAdapter> {
    const adaptersByKind = new Map<string, WorkflowTransferResourceAdapter>();

    for (const adapter of adapters) {
      this.assertValidName(adapter.kind, 'kind');
      if (adaptersByKind.has(adapter.kind)) {
        throw new Error(
          `Duplicate workflow transfer adapter kind "${adapter.kind}"`,
        );
      }

      adaptersByKind.set(adapter.kind, adapter);
    }

    return adaptersByKind;
  }

  private buildResourceKeyMap(
    adapters: WorkflowTransferResourceAdapter[],
  ): Map<string, WorkflowTransferResourceAdapter> {
    const adaptersByResourceKey = new Map<
      string,
      WorkflowTransferResourceAdapter
    >();

    for (const adapter of adapters) {
      if (adapter.resourceKeys.length === 0) {
        throw new Error(
          `Workflow transfer adapter "${adapter.kind}" must declare at least one resource key`,
        );
      }

      for (const resourceKey of adapter.resourceKeys) {
        this.assertValidName(resourceKey, 'resource key');
        if (adaptersByResourceKey.has(resourceKey)) {
          throw new Error(
            `Duplicate workflow transfer resource key "${resourceKey}"`,
          );
        }

        adaptersByResourceKey.set(resourceKey, adapter);
      }
    }

    return adaptersByResourceKey;
  }

  private assertDependenciesExist(
    adapters: WorkflowTransferResourceAdapter[],
  ): void {
    for (const adapter of adapters) {
      for (const dependency of adapter.dependsOn) {
        this.assertValidName(dependency, 'dependency');
        if (!this.adaptersByKind.has(dependency)) {
          throw new Error(
            `Workflow transfer adapter "${adapter.kind}" depends on unknown adapter "${dependency}"`,
          );
        }
      }
    }
  }

  private sortInDependencyOrder(
    adapters: WorkflowTransferResourceAdapter[],
  ): WorkflowTransferResourceAdapter[] {
    const ordered: WorkflowTransferResourceAdapter[] = [];
    const stateByKind = new Map<string, VisitState>();

    for (const adapter of adapters) {
      this.visitAdapter(adapter, [], stateByKind, ordered);
    }

    return ordered;
  }

  private visitAdapter(
    adapter: WorkflowTransferResourceAdapter,
    path: string[],
    stateByKind: Map<string, VisitState>,
    ordered: WorkflowTransferResourceAdapter[],
  ): void {
    const state = stateByKind.get(adapter.kind);
    if (state === 'visited') {
      return;
    }

    if (state === 'visiting') {
      const cycleStart = path.indexOf(adapter.kind);
      const cyclePath = [
        ...(cycleStart >= 0 ? path.slice(cycleStart) : path),
        adapter.kind,
      ];
      throw new Error(
        `Workflow transfer adapter dependency cycle: ${cyclePath.join(' -> ')}`,
      );
    }

    stateByKind.set(adapter.kind, 'visiting');
    for (const dependency of adapter.dependsOn) {
      this.visitAdapter(
        this.adaptersByKind.get(dependency)!,
        [...path, adapter.kind],
        stateByKind,
        ordered,
      );
    }
    stateByKind.set(adapter.kind, 'visited');
    ordered.push(adapter);
  }

  private assertValidName(value: string, label: string): void {
    if (!WORKFLOW_TRANSFER_RESOURCE_KIND_PATTERN.test(value)) {
      throw new Error(`Invalid workflow transfer adapter ${label} "${value}"`);
    }
  }
}
