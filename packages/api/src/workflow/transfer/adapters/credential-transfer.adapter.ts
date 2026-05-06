/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type WorkflowExportBundleCredential,
  type WorkflowImportResourceResult,
} from '@hexabot-ai/types';
import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';

import { CredentialOrmEntity } from '@/user/entities/credential.entity';
import { CredentialService } from '@/user/services/credential.service';

import {
  assertFoundAll,
  buildPostCreateEvent,
  buildResourceResult,
  PLACEHOLDER_CREDENTIAL_VALUE,
  uniqueResourceIds,
  type WorkflowTransferImportAdapterResult,
} from '../workflow-transfer.types';

export type CredentialTransferImportResult =
  WorkflowTransferImportAdapterResult & {
    placeholderExportIds: Set<string>;
  };

@Injectable()
export class CredentialTransferAdapter {
  constructor(private readonly credentialService: CredentialService) {}

  async buildExportResources(
    ids: string[],
  ): Promise<WorkflowExportBundleCredential[]> {
    const uniqueIds = uniqueResourceIds(ids);
    if (uniqueIds.length === 0) {
      return [];
    }

    const credentials = await this.credentialService.find({
      where: { id: In(uniqueIds) },
    });
    assertFoundAll(
      'credential',
      uniqueIds,
      credentials.map((credential) => credential.id),
    );

    return credentials.map((credential) => ({
      exportId: credential.id,
      name: credential.name,
      exportedOwnerId: credential.owner,
    }));
  }

  async importResources(
    manager: EntityManager,
    credentials: WorkflowExportBundleCredential[],
    ownerId: string,
  ): Promise<CredentialTransferImportResult> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];
    const warnings: string[] = [];
    const postCreateEvents: WorkflowTransferImportAdapterResult['postCreateEvents'] =
      [];
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
          buildResourceResult({
            kind: 'credential',
            exportId: credential.exportId,
            localId: existingByName.id,
            name: credential.name,
            action: 'reused',
          }),
        );
        continue;
      }

      const payload = {
        name: credential.name,
        value: PLACEHOLDER_CREDENTIAL_VALUE,
        owner: { id: ownerId },
      };
      const created = await manager.save(
        CredentialOrmEntity,
        manager.create(CredentialOrmEntity, payload),
      );

      idMap[credential.exportId] = created.id;
      placeholderExportIds.add(credential.exportId);
      resources.push(
        buildResourceResult({
          kind: 'credential',
          exportId: credential.exportId,
          localId: created.id,
          name: credential.name,
          action: 'placeholder_created',
        }),
      );
      postCreateEvents.push(
        buildPostCreateEvent('credential', created, payload),
      );
      warnings.push(
        `Credential "${credential.name}" was imported as a placeholder and must be updated before use.`,
      );
    }

    return {
      idMap,
      placeholderExportIds,
      resources,
      warnings,
      postCreateEvents,
    };
  }
}
