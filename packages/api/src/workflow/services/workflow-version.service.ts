/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  WorkflowVersion,
  WorkflowVersionCreateDto,
  WorkflowVersionDtoConfig,
  WorkflowVersionTransformerDto,
} from '../dto/workflow-version.dto';
import { WorkflowVersionOrmEntity } from '../entities/workflow-version.entity';
import { WorkflowVersionRepository } from '../repositories/workflow-version.repository';

@Injectable()
export class WorkflowVersionService extends BaseOrmService<
  WorkflowVersionOrmEntity,
  WorkflowVersionTransformerDto,
  WorkflowVersionDtoConfig
> {
  /**
   * Create the service with a workflow version repository.
   * @param repository Repository for workflow version entities.
   */
  constructor(readonly repository: WorkflowVersionRepository) {
    super(repository);
  }

  /**
   * List workflow versions for a workflow, ordered by newest version first.
   * @param workflowId Workflow identifier.
   * @returns Matching workflow versions.
   */
  async findByWorkflow(workflowId: string): Promise<WorkflowVersion[]> {
    return await this.find({
      where: { workflow: { id: workflowId } },
      order: { version: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Find a workflow version by workflow id and version id.
   * @param workflowId Workflow identifier.
   * @param versionId Workflow version identifier.
   * @returns The matching workflow version or null.
   */
  async findOneByWorkflow(
    workflowId: string,
    versionId: string,
  ): Promise<WorkflowVersion | null> {
    return await this.findOne({
      where: { id: versionId, workflow: { id: workflowId } },
    });
  }

  /**
   * Create a new workflow snapshot with the next version number.
   * @param params Snapshot creation parameters.
   * @returns The created workflow version.
   */
  public async createSnapshot(
    params: WorkflowVersionCreateDto,
  ): Promise<WorkflowVersion> {
    const latestVersion = await this.findOne({
      where: { workflow: { id: params.workflow } },
      order: { version: 'DESC' },
    });
    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    return await this.create({
      ...params,
      version: nextVersion,
      checksum: WorkflowVersionService.computeChecksum(params.definitionYml),
      parentVersion: params.parentVersionId
        ? { id: params.parentVersionId }
        : null,
      createdBy: params.createdBy ? { id: params.createdBy } : null,
    });
  }

  /**
   * Compute a SHA-256 checksum for the workflow definition.
   * @param definitionYml Workflow definition in YAML format.
   * @returns Hex-encoded checksum.
   */
  public static computeChecksum(definitionYml: string): string {
    return createHash('sha256').update(definitionYml).digest('hex');
  }
}
