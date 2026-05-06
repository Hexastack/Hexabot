/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { isDeepStrictEqual } from 'node:util';

import {
  type Credential,
  type WorkflowExportBundle,
  type WorkflowExportBundleCredential,
  type WorkflowExportBundleMcpServer,
  type WorkflowImportResourceResult,
} from '@hexabot-ai/types';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';

import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { ContentTypeOrmEntity } from '@/cms/entities/content-type.entity';
import { CredentialOrmEntity } from '@/user/entities/credential.entity';

import { McpServerOrmEntity } from '../../entities/mcp-server.entity';
import { MemoryDefinitionOrmEntity } from '../../entities/memory-definition.entity';
import { McpServerTransport } from '../../types';
import { McpServerService } from '../mcp-server.service';
import { MemoryDefinitionService } from '../memory-definition.service';

import type {
  WorkflowBindingResourceRefs,
  WorkflowTaskResourceIdMaps,
  WorkflowTaskResourceRefs,
} from './workflow-transfer-definition.service';

const PLACEHOLDER_CREDENTIAL_VALUE =
  '__HEXABOT_IMPORTED_CREDENTIAL_PLACEHOLDER__';

type ResourceActionInput = Omit<WorkflowImportResourceResult, 'localId'> & {
  localId?: string;
};

export type ImportedWorkflowTransferResources = {
  bindingIdMaps: WorkflowTaskResourceIdMaps;
  taskIdMaps: WorkflowTaskResourceIdMaps;
  resources: WorkflowImportResourceResult[];
  warnings: string[];
};

@Injectable()
export class WorkflowTransferResourceService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly memoryDefinitionService: MemoryDefinitionService,
    private readonly mcpServerService: McpServerService,
  ) {}

  async buildExportResources(
    refs: WorkflowBindingResourceRefs,
    taskRefs: WorkflowTaskResourceRefs,
  ): Promise<WorkflowExportBundle['resources']> {
    const memoryDefinitions = await this.findReferencedMemoryDefinitions([
      ...refs.memoryDefinitions,
      ...taskRefs.memoryDefinitions,
    ]);
    const mcpServers = await this.findReferencedMcpServers([
      ...refs.mcpServers,
      ...taskRefs.mcpServers,
    ]);
    const referencedCredentials = await this.findReferencedCredentials([
      ...refs.credentials,
      ...taskRefs.credentials,
    ]);
    const contentTypes = await this.findReferencedContentTypes([
      ...refs.contentTypes,
      ...taskRefs.contentTypes,
    ]);
    const labels = await this.findReferencedLabels([
      ...refs.labels,
      ...taskRefs.labels,
    ]);
    const labelGroups = this.extractLabelGroupResources(labels);
    const credentials = this.extractCredentialResources(
      mcpServers,
      referencedCredentials,
    );

    return {
      memoryDefinitions: memoryDefinitions.map((definition) => ({
        exportId: definition.id,
        name: definition.name,
        slug: definition.slug,
        scope: definition.scope,
        schema: definition.schema,
        ttlSeconds: definition.ttlSeconds ?? null,
      })),
      mcpServers: mcpServers.map((server) => ({
        exportId: server.id,
        name: server.name,
        enabled: server.enabled,
        transport: server.transport,
        url: server.url ?? null,
        command: server.command ?? null,
        args: server.args ?? null,
        cwd: server.cwd ?? null,
        credentialExportId: server.credential?.id ?? null,
      })),
      credentials,
      contentTypes: contentTypes.map((contentType) => ({
        exportId: contentType.id,
        name: contentType.name,
        schema: contentType.schema,
      })),
      labelGroups: labelGroups.map((group) => ({
        exportId: group.id,
        name: group.name,
      })),
      labels: labels.map((label) => ({
        exportId: label.id,
        title: label.title,
        name: label.name,
        description: label.description ?? null,
        groupExportId: label.group?.id ?? null,
      })),
    };
  }

  assertBundleContainsReferencedResources(
    bundle: WorkflowExportBundle,
    refs: WorkflowBindingResourceRefs,
    taskRefs: WorkflowTaskResourceRefs,
  ): void {
    this.assertRefsAreBundled(
      'memory definition',
      [...refs.memoryDefinitions, ...taskRefs.memoryDefinitions],
      bundle.resources.memoryDefinitions.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'MCP server',
      [...refs.mcpServers, ...taskRefs.mcpServers],
      bundle.resources.mcpServers.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'credential',
      [
        ...refs.credentials,
        ...taskRefs.credentials,
        ...bundle.resources.mcpServers
          .map((resource) => resource.credentialExportId)
          .filter((id): id is string => typeof id === 'string' && !!id),
      ],
      bundle.resources.credentials.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'content type',
      [...refs.contentTypes, ...taskRefs.contentTypes],
      bundle.resources.contentTypes.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'label',
      [...refs.labels, ...taskRefs.labels],
      bundle.resources.labels.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'label group',
      bundle.resources.labels
        .map((resource) => resource.groupExportId)
        .filter((id): id is string => typeof id === 'string' && !!id),
      bundle.resources.labelGroups.map((resource) => resource.exportId),
    );
  }

  async importResources(
    manager: EntityManager,
    resources: WorkflowExportBundle['resources'],
    ownerId: string,
  ): Promise<ImportedWorkflowTransferResources> {
    const credentialResult = await this.importCredentials(
      manager,
      resources.credentials,
      ownerId,
    );
    const memoryResult = await this.importMemoryDefinitions(
      manager,
      resources.memoryDefinitions,
    );
    const contentTypeResult = await this.importContentTypes(
      manager,
      resources.contentTypes,
    );
    const labelGroupResult = await this.importLabelGroups(
      manager,
      resources.labelGroups,
    );
    const labelResult = await this.importLabels(
      manager,
      resources.labels,
      labelGroupResult.idMap,
    );
    const mcpResult = await this.importMcpServers(
      manager,
      resources.mcpServers,
      credentialResult.idMap,
      credentialResult.placeholderExportIds,
    );

    return {
      bindingIdMaps: {
        contentTypes: contentTypeResult.idMap,
        credentials: credentialResult.idMap,
        labels: labelResult.idMap,
        mcpServers: mcpResult.idMap,
        memoryDefinitions: memoryResult.idMap,
      },
      taskIdMaps: {
        contentTypes: contentTypeResult.idMap,
        credentials: credentialResult.idMap,
        labels: labelResult.idMap,
        mcpServers: mcpResult.idMap,
        memoryDefinitions: memoryResult.idMap,
      },
      resources: [
        ...credentialResult.resources,
        ...memoryResult.resources,
        ...contentTypeResult.resources,
        ...labelGroupResult.resources,
        ...labelResult.resources,
        ...mcpResult.resources,
      ],
      warnings: [...credentialResult.warnings, ...mcpResult.warnings],
    };
  }

  private async findReferencedMemoryDefinitions(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return [];
    }

    const definitions = await this.memoryDefinitionService.find({
      where: { id: In(uniqueIds) },
    });
    this.assertFoundAll(
      'memory definition',
      uniqueIds,
      definitions.map((definition) => definition.id),
    );

    return definitions;
  }

  private async findReferencedMcpServers(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return [];
    }

    const servers = await this.mcpServerService.findAndPopulate({
      where: { id: In(uniqueIds) },
    });
    this.assertFoundAll(
      'MCP server',
      uniqueIds,
      servers.map((server) => server.id),
    );

    return servers;
  }

  private async findReferencedCredentials(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return [];
    }

    const credentials = await this.dataSource
      .getRepository(CredentialOrmEntity)
      .find({
        where: { id: In(uniqueIds) },
        relations: ['owner'],
      });
    this.assertFoundAll(
      'credential',
      uniqueIds,
      credentials.map((credential) => credential.id),
    );

    return credentials;
  }

  private async findReferencedContentTypes(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return [];
    }

    const contentTypes = await this.dataSource
      .getRepository(ContentTypeOrmEntity)
      .find({
        where: { id: In(uniqueIds) },
      });
    this.assertFoundAll(
      'content type',
      uniqueIds,
      contentTypes.map((contentType) => contentType.id),
    );

    return contentTypes;
  }

  private async findReferencedLabels(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return [];
    }

    const labels = await this.dataSource.getRepository(LabelOrmEntity).find({
      where: { id: In(uniqueIds) },
      relations: ['group'],
    });
    this.assertFoundAll(
      'label',
      uniqueIds,
      labels.map((label) => label.id),
    );

    return labels;
  }

  private extractLabelGroupResources(
    labels: LabelOrmEntity[],
  ): LabelGroupOrmEntity[] {
    const groupsById = new Map<string, LabelGroupOrmEntity>();

    for (const label of labels) {
      if (label.group?.id) {
        groupsById.set(label.group.id, label.group);
      }
    }

    return Array.from(groupsById.values());
  }

  private extractCredentialResources(
    mcpServers: Array<{ credential?: Credential | null }>,
    credentials: Array<Credential | CredentialOrmEntity> = [],
  ): WorkflowExportBundleCredential[] {
    const credentialsById = new Map<string, WorkflowExportBundleCredential>();
    for (const credential of credentials) {
      if (credential.id) {
        credentialsById.set(credential.id, {
          exportId: credential.id,
          name: credential.name,
          exportedOwnerId:
            credential.owner && typeof credential.owner === 'object'
              ? credential.owner.id
              : credential.owner,
        });
      }
    }
    for (const server of mcpServers) {
      if (server.credential?.id) {
        credentialsById.set(server.credential.id, {
          exportId: server.credential.id,
          name: server.credential.name,
          exportedOwnerId: server.credential.owner,
        });
      }
    }

    return Array.from(credentialsById.values());
  }

  private assertFoundAll(
    resourceLabel: string,
    expectedIds: string[],
    foundIds: string[],
  ): void {
    const found = new Set(foundIds);
    const missing = expectedIds.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Unable to export workflow: missing ${resourceLabel}(s): ${missing.join(
          ', ',
        )}`,
      );
    }
  }

  private assertRefsAreBundled(
    resourceLabel: string,
    refs: string[],
    bundledIds: string[],
  ): void {
    const bundled = new Set(bundledIds);
    const missing = Array.from(new Set(refs)).filter((id) => !bundled.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Workflow bundle is missing referenced ${resourceLabel}(s): ${missing.join(
          ', ',
        )}`,
      );
    }
  }

  private async importCredentials(
    manager: EntityManager,
    credentials: WorkflowExportBundleCredential[],
    ownerId: string,
  ): Promise<{
    idMap: Record<string, string>;
    placeholderExportIds: Set<string>;
    resources: WorkflowImportResourceResult[];
    warnings: string[];
  }> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];
    const warnings: string[] = [];
    const placeholderExportIds = new Set<string>();

    for (const credential of credentials) {
      const existingByName = await manager.findOne(CredentialOrmEntity, {
        where: { name: credential.name },
        relations: ['owner'],
      });

      if (existingByName) {
        const existingOwnerId =
          existingByName.owner && typeof existingByName.owner === 'object'
            ? existingByName.owner.id
            : null;
        if (existingOwnerId !== ownerId) {
          throw new ConflictException(
            `Credential "${credential.name}" already exists for another user`,
          );
        }

        idMap[credential.exportId] = existingByName.id;
        resources.push(
          this.resourceResult({
            kind: 'credential',
            exportId: credential.exportId,
            localId: existingByName.id,
            name: credential.name,
            action: 'reused',
          }),
        );
        continue;
      }

      const created = await manager.save(
        CredentialOrmEntity,
        manager.create(CredentialOrmEntity, {
          name: credential.name,
          value: PLACEHOLDER_CREDENTIAL_VALUE,
          owner: { id: ownerId },
        }),
      );

      idMap[credential.exportId] = created.id;
      placeholderExportIds.add(credential.exportId);
      resources.push(
        this.resourceResult({
          kind: 'credential',
          exportId: credential.exportId,
          localId: created.id,
          name: credential.name,
          action: 'placeholder_created',
        }),
      );
      warnings.push(
        `Credential "${credential.name}" was imported as a placeholder and must be updated before use.`,
      );
    }

    return { idMap, placeholderExportIds, resources, warnings };
  }

  private async importMemoryDefinitions(
    manager: EntityManager,
    definitions: WorkflowExportBundle['resources']['memoryDefinitions'],
  ): Promise<{
    idMap: Record<string, string>;
    resources: WorkflowImportResourceResult[];
  }> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];

    for (const definition of definitions) {
      const existing = await manager.findOne(MemoryDefinitionOrmEntity, {
        where: { slug: definition.slug },
      });

      if (existing) {
        if (!this.isEquivalentMemoryDefinition(existing, definition)) {
          throw new ConflictException(
            `Memory definition "${definition.slug}" already exists with different configuration`,
          );
        }

        idMap[definition.exportId] = existing.id;
        resources.push(
          this.resourceResult({
            kind: 'memoryDefinition',
            exportId: definition.exportId,
            localId: existing.id,
            name: definition.name,
            action: 'reused',
          }),
        );
        continue;
      }

      const created = await manager.save(
        MemoryDefinitionOrmEntity,
        manager.create(MemoryDefinitionOrmEntity, {
          name: definition.name,
          slug: definition.slug,
          scope: definition.scope,
          schema: definition.schema,
          ttlSeconds: definition.ttlSeconds ?? null,
        }),
      );

      idMap[definition.exportId] = created.id;
      resources.push(
        this.resourceResult({
          kind: 'memoryDefinition',
          exportId: definition.exportId,
          localId: created.id,
          name: definition.name,
          action: 'created',
        }),
      );
    }

    return { idMap, resources };
  }

  private async importContentTypes(
    manager: EntityManager,
    contentTypes: WorkflowExportBundle['resources']['contentTypes'],
  ): Promise<{
    idMap: Record<string, string>;
    resources: WorkflowImportResourceResult[];
  }> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];

    for (const contentType of contentTypes) {
      const existing = await manager.findOne(ContentTypeOrmEntity, {
        where: { name: contentType.name },
      });

      if (existing) {
        if (!this.isEquivalentContentType(existing, contentType)) {
          throw new ConflictException(
            `Content type "${contentType.name}" already exists with different configuration`,
          );
        }

        idMap[contentType.exportId] = existing.id;
        resources.push(
          this.resourceResult({
            kind: 'contentType',
            exportId: contentType.exportId,
            localId: existing.id,
            name: contentType.name,
            action: 'reused',
          }),
        );
        continue;
      }

      const created = await manager.save(
        ContentTypeOrmEntity,
        manager.create(ContentTypeOrmEntity, {
          name: contentType.name,
          schema: contentType.schema,
        }),
      );

      idMap[contentType.exportId] = created.id;
      resources.push(
        this.resourceResult({
          kind: 'contentType',
          exportId: contentType.exportId,
          localId: created.id,
          name: contentType.name,
          action: 'created',
        }),
      );
    }

    return { idMap, resources };
  }

  private async importLabelGroups(
    manager: EntityManager,
    labelGroups: WorkflowExportBundle['resources']['labelGroups'],
  ): Promise<{
    idMap: Record<string, string>;
    resources: WorkflowImportResourceResult[];
  }> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];

    for (const labelGroup of labelGroups) {
      const existing = await manager.findOne(LabelGroupOrmEntity, {
        where: { name: labelGroup.name },
      });

      if (existing) {
        idMap[labelGroup.exportId] = existing.id;
        resources.push(
          this.resourceResult({
            kind: 'labelGroup',
            exportId: labelGroup.exportId,
            localId: existing.id,
            name: labelGroup.name,
            action: 'reused',
          }),
        );
        continue;
      }

      const created = await manager.save(
        LabelGroupOrmEntity,
        manager.create(LabelGroupOrmEntity, {
          name: labelGroup.name,
        }),
      );

      idMap[labelGroup.exportId] = created.id;
      resources.push(
        this.resourceResult({
          kind: 'labelGroup',
          exportId: labelGroup.exportId,
          localId: created.id,
          name: labelGroup.name,
          action: 'created',
        }),
      );
    }

    return { idMap, resources };
  }

  private async importLabels(
    manager: EntityManager,
    labels: WorkflowExportBundle['resources']['labels'],
    labelGroupIdMap: Record<string, string>,
  ): Promise<{
    idMap: Record<string, string>;
    resources: WorkflowImportResourceResult[];
  }> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];

    for (const label of labels) {
      const groupId = label.groupExportId
        ? labelGroupIdMap[label.groupExportId]
        : null;

      if (label.groupExportId && !groupId) {
        throw new BadRequestException(
          `Workflow bundle is missing label group "${label.groupExportId}" required by label "${label.name}"`,
        );
      }

      const existingByName = await manager.findOne(LabelOrmEntity, {
        where: { name: label.name },
        relations: ['group'],
      });

      if (existingByName) {
        if (!this.isEquivalentLabel(existingByName, label, groupId)) {
          throw new ConflictException(
            `Label "${label.name}" already exists with different configuration`,
          );
        }

        idMap[label.exportId] = existingByName.id;
        resources.push(
          this.resourceResult({
            kind: 'label',
            exportId: label.exportId,
            localId: existingByName.id,
            name: label.name,
            action: 'reused',
          }),
        );
        continue;
      }

      const existingByTitle = await manager.findOne(LabelOrmEntity, {
        where: { title: label.title },
      });
      if (existingByTitle) {
        throw new ConflictException(
          `Label title "${label.title}" already exists with a different name`,
        );
      }

      const created = await manager.save(
        LabelOrmEntity,
        manager.create(LabelOrmEntity, {
          title: label.title,
          name: label.name,
          description: label.description ?? null,
          group: groupId ? { id: groupId } : null,
          builtin: false,
        }),
      );

      idMap[label.exportId] = created.id;
      resources.push(
        this.resourceResult({
          kind: 'label',
          exportId: label.exportId,
          localId: created.id,
          name: label.name,
          action: 'created',
        }),
      );
    }

    return { idMap, resources };
  }

  private async importMcpServers(
    manager: EntityManager,
    servers: WorkflowExportBundleMcpServer[],
    credentialIdMap: Record<string, string>,
    placeholderCredentialExportIds: Set<string>,
  ): Promise<{
    idMap: Record<string, string>;
    resources: WorkflowImportResourceResult[];
    warnings: string[];
  }> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];
    const warnings: string[] = [];

    for (const server of servers) {
      const credentialId = server.credentialExportId
        ? credentialIdMap[server.credentialExportId]
        : null;
      const credential = credentialId
        ? await manager.findOne(CredentialOrmEntity, {
            where: { id: credentialId },
          })
        : null;
      const importedCredential = server.credentialExportId
        ? credentialId
          ? credential
          : null
        : null;
      const shouldDisable =
        Boolean(server.credentialExportId) &&
        placeholderCredentialExportIds.has(server.credentialExportId!);
      const existing = await manager.findOne(McpServerOrmEntity, {
        where: { name: server.name },
        relations: ['credential'],
      });

      if (existing) {
        if (!this.isEquivalentMcpServer(existing, server, importedCredential)) {
          throw new ConflictException(
            `MCP server "${server.name}" already exists with different configuration`,
          );
        }

        idMap[server.exportId] = existing.id;
        resources.push(
          this.resourceResult({
            kind: 'mcpServer',
            exportId: server.exportId,
            localId: existing.id,
            name: server.name,
            action: 'reused',
          }),
        );
        continue;
      }

      if (server.credentialExportId && !credentialId) {
        throw new BadRequestException(
          `Workflow bundle is missing credential "${server.credentialExportId}" required by MCP server "${server.name}"`,
        );
      }

      const created = await manager.save(
        McpServerOrmEntity,
        manager.create(McpServerOrmEntity, {
          name: server.name,
          enabled: shouldDisable ? false : server.enabled,
          transport: server.transport,
          url: server.url,
          command: server.command,
          args: server.args,
          cwd: server.cwd,
          credential:
            credentialId && server.transport === McpServerTransport.http
              ? { id: credentialId }
              : null,
        }),
      );

      idMap[server.exportId] = created.id;
      resources.push(
        this.resourceResult({
          kind: 'mcpServer',
          exportId: server.exportId,
          localId: created.id,
          name: server.name,
          action: 'created',
        }),
      );

      if (shouldDisable) {
        warnings.push(
          `MCP server "${server.name}" was disabled because it depends on an imported placeholder credential.`,
        );
      }
    }

    return { idMap, resources, warnings };
  }

  private isEquivalentMemoryDefinition(
    existing: MemoryDefinitionOrmEntity,
    imported: WorkflowExportBundle['resources']['memoryDefinitions'][number],
  ): boolean {
    return (
      existing.name === imported.name &&
      existing.scope === imported.scope &&
      (existing.ttlSeconds ?? null) === (imported.ttlSeconds ?? null) &&
      isDeepStrictEqual(existing.schema, imported.schema)
    );
  }

  private isEquivalentContentType(
    existing: ContentTypeOrmEntity,
    imported: WorkflowExportBundle['resources']['contentTypes'][number],
  ): boolean {
    return isDeepStrictEqual(existing.schema, imported.schema);
  }

  private isEquivalentLabel(
    existing: LabelOrmEntity,
    imported: WorkflowExportBundle['resources']['labels'][number],
    importedGroupId: string | null,
  ): boolean {
    const existingGroupId =
      existing.group && typeof existing.group === 'object'
        ? existing.group.id
        : null;

    return (
      existing.title === imported.title &&
      (existing.description ?? null) === (imported.description ?? null) &&
      existingGroupId === importedGroupId
    );
  }

  private isEquivalentMcpServer(
    existing: McpServerOrmEntity,
    imported: WorkflowExportBundleMcpServer,
    importedCredential: CredentialOrmEntity | null,
  ): boolean {
    const existingCredentialName =
      existing.credential && typeof existing.credential === 'object'
        ? existing.credential.name
        : null;
    const importedCredentialName = importedCredential?.name ?? null;

    return (
      existing.transport === imported.transport &&
      (existing.url ?? null) === (imported.url ?? null) &&
      (existing.command ?? null) === (imported.command ?? null) &&
      isDeepStrictEqual(existing.args ?? null, imported.args ?? null) &&
      (existing.cwd ?? null) === (imported.cwd ?? null) &&
      existingCredentialName === importedCredentialName
    );
  }

  private resourceResult(
    input: ResourceActionInput,
  ): WorkflowImportResourceResult {
    if (!input.localId) {
      throw new Error(`Missing local ID for imported ${input.kind}`);
    }

    return {
      kind: input.kind,
      exportId: input.exportId,
      localId: input.localId,
      name: input.name,
      action: input.action,
    };
  }
}
