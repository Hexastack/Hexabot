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
import { In } from 'typeorm';

import { CredentialOrmEntity } from '@/user/entities/credential.entity';
import { CredentialService } from '@/user/services/credential.service';

import {
  WorkflowTransferAdapter,
  WorkflowTransferExportContext,
  WorkflowTransferImportContext,
  WorkflowTransferResourceAdapter,
} from '../workflow-transfer-resource-adapter';
import {
  assertFoundAll,
  buildPostCreateEvent,
  buildResourceResult,
  PLACEHOLDER_CREDENTIAL_VALUE,
  uniqueResourceIds,
  type WorkflowTransferImportAdapterResult,
} from '../workflow-transfer.types';

@WorkflowTransferAdapter()
@Injectable()
export class CredentialTransferAdapter extends WorkflowTransferResourceAdapter {
  override readonly kind = 'credential';

  override readonly resourceKeys = ['credentials'];

  constructor(private readonly credentialService: CredentialService) {
    super();
  }

  override async buildExportResources(
    ctx: WorkflowTransferExportContext,
  ): Promise<Record<string, WorkflowExportBundleCredential[]>> {
    return {
      credentials: await this.buildCredentialExportResources(
        ctx.getRefs(this.kind),
      ),
    };
  }

  private async buildCredentialExportResources(
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

  override async importResources(
    ctx: WorkflowTransferImportContext,
  ): Promise<WorkflowTransferImportAdapterResult> {
    const credentials =
      ctx.getResources<WorkflowExportBundleCredential>('credentials');
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];
    const warnings: string[] = [];
    const postCreateEvents: WorkflowTransferImportAdapterResult['postCreateEvents'] =
      [];
    const placeholderExportIds = new Set<string>();

    for (const credential of credentials) {
      const existingByName = await ctx.manager.findOne(CredentialOrmEntity, {
        where: { name: credential.name },
        relations: ['owner'],
      });

      if (existingByName) {
        const existingOwnerId =
          existingByName.owner && typeof existingByName.owner === 'object'
            ? existingByName.owner.id
            : null;
        if (existingOwnerId !== ctx.ownerId) {
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
        owner: { id: ctx.ownerId },
      };
      const created = await ctx.manager.save(
        CredentialOrmEntity,
        ctx.manager.create(CredentialOrmEntity, payload),
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
      resources,
      warnings,
      postCreateEvents,
      metadata: {
        placeholderExportIds,
      },
    };
  }
}
