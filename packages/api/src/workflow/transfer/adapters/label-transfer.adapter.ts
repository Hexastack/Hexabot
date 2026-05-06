/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type WorkflowExportBundle,
  type WorkflowExportBundleLabel,
  type WorkflowExportBundleLabelGroup,
  type WorkflowImportResourceResult,
} from '@hexabot-ai/types';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager, In } from 'typeorm';

import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { LabelService } from '@/chat/services/label.service';

import {
  assertFoundAll,
  buildPostCreateEvent,
  buildResourceResult,
  uniqueResourceIds,
  type WorkflowTransferImportAdapterResult,
} from '../workflow-transfer.types';

type LabelExportResources = {
  labelGroups: WorkflowExportBundleLabelGroup[];
  labels: WorkflowExportBundleLabel[];
};

@Injectable()
export class LabelTransferAdapter {
  constructor(private readonly labelService: LabelService) {}

  async buildExportResources(ids: string[]): Promise<LabelExportResources> {
    const uniqueIds = uniqueResourceIds(ids);
    if (uniqueIds.length === 0) {
      return { labelGroups: [], labels: [] };
    }

    const labels = await this.labelService.findAndPopulate({
      where: { id: In(uniqueIds) },
    });
    assertFoundAll(
      'label',
      uniqueIds,
      labels.map((label) => label.id),
    );

    const groupsById = new Map<string, WorkflowExportBundleLabelGroup>();
    for (const label of labels) {
      if (label.group?.id) {
        groupsById.set(label.group.id, {
          exportId: label.group.id,
          name: label.group.name,
        });
      }
    }

    return {
      labelGroups: Array.from(groupsById.values()),
      labels: labels.map((label) => ({
        exportId: label.id,
        title: label.title,
        name: label.name,
        description: label.description ?? null,
        groupExportId: label.group?.id ?? null,
      })),
    };
  }

  async importResources(
    manager: EntityManager,
    labelGroups: WorkflowExportBundle['resources']['labelGroups'],
    labels: WorkflowExportBundle['resources']['labels'],
  ): Promise<WorkflowTransferImportAdapterResult> {
    const groupResult = await this.importLabelGroups(manager, labelGroups);
    const labelResult = await this.importLabels(
      manager,
      labels,
      groupResult.idMap,
    );

    return {
      idMap: labelResult.idMap,
      resources: [...groupResult.resources, ...labelResult.resources],
      warnings: [],
      postCreateEvents: [
        ...groupResult.postCreateEvents,
        ...labelResult.postCreateEvents,
      ],
    };
  }

  private async importLabelGroups(
    manager: EntityManager,
    labelGroups: WorkflowExportBundle['resources']['labelGroups'],
  ): Promise<WorkflowTransferImportAdapterResult> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];
    const postCreateEvents: WorkflowTransferImportAdapterResult['postCreateEvents'] =
      [];

    for (const labelGroup of labelGroups) {
      const existing = await manager.findOne(LabelGroupOrmEntity, {
        where: { name: labelGroup.name },
      });

      if (existing) {
        idMap[labelGroup.exportId] = existing.id;
        resources.push(
          buildResourceResult({
            kind: 'labelGroup',
            exportId: labelGroup.exportId,
            localId: existing.id,
            name: labelGroup.name,
            action: 'reused',
          }),
        );
        continue;
      }

      const payload = {
        name: labelGroup.name,
      };
      const created = await manager.save(
        LabelGroupOrmEntity,
        manager.create(LabelGroupOrmEntity, payload),
      );

      idMap[labelGroup.exportId] = created.id;
      resources.push(
        buildResourceResult({
          kind: 'labelGroup',
          exportId: labelGroup.exportId,
          localId: created.id,
          name: labelGroup.name,
          action: 'created',
        }),
      );
      postCreateEvents.push(
        buildPostCreateEvent('labelGroup', created, payload),
      );
    }

    return {
      idMap,
      resources,
      warnings: [],
      postCreateEvents,
    };
  }

  private async importLabels(
    manager: EntityManager,
    labels: WorkflowExportBundle['resources']['labels'],
    labelGroupIdMap: Record<string, string>,
  ): Promise<WorkflowTransferImportAdapterResult> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];
    const postCreateEvents: WorkflowTransferImportAdapterResult['postCreateEvents'] =
      [];

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
          buildResourceResult({
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

      const payload = {
        title: label.title,
        name: label.name,
        description: label.description ?? null,
        group: groupId ? { id: groupId } : null,
        builtin: false,
      };
      const created = await manager.save(
        LabelOrmEntity,
        manager.create(LabelOrmEntity, payload),
      );

      idMap[label.exportId] = created.id;
      resources.push(
        buildResourceResult({
          kind: 'label',
          exportId: label.exportId,
          localId: created.id,
          name: label.name,
          action: 'created',
        }),
      );
      postCreateEvents.push(buildPostCreateEvent('label', created, payload));
    }

    return {
      idMap,
      resources,
      warnings: [],
      postCreateEvents,
    };
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
}
