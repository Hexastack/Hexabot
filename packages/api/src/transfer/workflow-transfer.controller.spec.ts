/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';

import { userFixtureIds } from '@/utils/test/fixtures/user';
import { WorkflowType } from '@/workflow/types';

import { WorkflowTransferController } from './workflow-transfer.controller';
import { WorkflowTransferService } from './workflow-transfer.service';

describe('WorkflowTransferController', () => {
  const workflowTransferServiceMock = {
    exportWorkflow: jest.fn(),
    importWorkflow: jest.fn(),
  } as jest.Mocked<
    Pick<WorkflowTransferService, 'exportWorkflow' | 'importWorkflow'>
  >;
  let controller: WorkflowTransferController;

  const buildWorkflow = () => ({
    id: randomUUID(),
    name: 'Imported workflow',
    description: null,
    type: WorkflowType.conversational,
    schedule: null,
    inputSchema: {},
    createdBy: userFixtureIds.admin,
    currentVersion: null,
    publishedVersion: null,
    builtin: false,
    x: 0,
    y: 0,
    zoom: 1,
    direction: 'horizontal',
    runAfterMs: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new WorkflowTransferController(
      workflowTransferServiceMock as unknown as WorkflowTransferService,
    );
  });

  it('exports a workflow bundle with download headers', async () => {
    const content = 'kind: hexabot.workflow.bundle\nschemaVersion: 1\n';
    workflowTransferServiceMock.exportWorkflow.mockResolvedValue({
      filename: 'workflow.workflow.yml',
      content,
    });
    const response = {
      setHeader: jest.fn(),
    } as unknown as ExpressResponse;
    const result = await controller.exportWorkflow(randomUUID(), response);

    expect(result).toBe(content);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/x-yaml; charset=utf-8',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="workflow.workflow.yml"',
    );
  });

  it('imports an uploaded workflow bundle for an authenticated user', async () => {
    const workflow = buildWorkflow();
    workflowTransferServiceMock.importWorkflow.mockResolvedValue({
      workflow,
      resources: [],
      warnings: [],
    } as any);

    const result = await controller.importWorkflow(
      {
        buffer: Buffer.from('kind: hexabot.workflow.bundle'),
      } as Express.Multer.File,
      {
        session: { passport: { user: { id: userFixtureIds.admin } } },
      } as any,
    );

    expect(workflowTransferServiceMock.importWorkflow).toHaveBeenCalledWith(
      'kind: hexabot.workflow.bundle',
      userFixtureIds.admin,
    );
    expect(result.workflow.id).toBe(workflow.id);
  });

  it('rejects workflow imports without an authenticated user', async () => {
    await expect(
      controller.importWorkflow(
        { buffer: Buffer.from('') } as Express.Multer.File,
        {} as any,
      ),
    ).rejects.toThrow(
      new UnauthorizedException(
        'Only authenticated users can import workflows',
      ),
    );
  });

  it('rejects workflow imports without an uploaded file', async () => {
    await expect(
      controller.importWorkflow(
        undefined as any,
        {
          session: { passport: { user: { id: userFixtureIds.admin } } },
        } as any,
      ),
    ).rejects.toThrow(
      new BadRequestException('No workflow bundle file was selected'),
    );
  });
});
