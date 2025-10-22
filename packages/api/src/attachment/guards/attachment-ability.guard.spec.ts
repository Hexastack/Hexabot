/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BadRequestException,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { Model } from '@/user/schemas/model.schema';
import { Permission } from '@/user/schemas/permission.schema';
import { ModelService } from '@/user/services/model.service';
import { PermissionService } from '@/user/services/permission.service';
import { Action } from '@/user/types/action.type';
import { buildTestingMocks } from '@/utils/test/utils';

import { attachment } from '../mocks/attachment.mock';
import { AttachmentService } from '../services/attachment.service';
import { AttachmentResourceRef } from '../types';

import { AttachmentGuard } from './attachment-ability.guard';

describe('AttachmentGuard', () => {
  let guard: AttachmentGuard;
  let permissionService: PermissionService;
  let modelService: ModelService;
  let attachmentService: AttachmentService;

  beforeEach(async () => {
    const { getMocks } = await buildTestingMocks({
      providers: [
        AttachmentGuard,
        {
          provide: PermissionService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: ModelService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: AttachmentService,
          useValue: { findOne: jest.fn() },
        },
      ],
    });

    [guard, permissionService, modelService, attachmentService] =
      await getMocks([
        AttachmentGuard,
        PermissionService,
        ModelService,
        AttachmentService,
      ]);
  });

  describe('canActivate', () => {
    it('should allow GET requests with valid ref', async () => {
      const mockUser = { roles: ['admin-id'] } as any;
      const mockRef = [AttachmentResourceRef.UserAvatar];

      jest.spyOn(modelService, 'findOne').mockImplementation((({ where }) => {
        return typeof where === 'string' ||
          !['user', 'attachment'].includes(where.identity)
          ? Promise.reject('Invalid #1')
          : Promise.resolve({
              identity: where.identity,
              id: `${where.identity}-id`,
            } as Model);
      }) as any);

      jest.spyOn(permissionService, 'findOne').mockImplementation(((
        criteria,
      ) => {
        const roleIds = criteria?.roleId?.$in ?? [];
        return typeof criteria !== 'object' ||
          !Array.isArray(roleIds) ||
          !roleIds.includes('admin-id') ||
          criteria.modelId !== 'user-id' ||
          criteria.action !== Action.READ
          ? Promise.reject('Invalid #2')
          : Promise.resolve({
              modelId: criteria.modelId,
              action: Action.READ,
              roleId: 'admin-id',
            } as unknown as Permission);
      }) as any);

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            query: { where: { resourceRef: mockRef } },
            method: 'GET',
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw BadRequestException for GET requests with invalid ref', async () => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            query: { where: { resourceRef: 'invalid_ref' } },
            method: 'GET',
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow GET requests with valid id', async () => {
      const mockUser = { roles: ['admin-id'] } as any;

      jest.spyOn(attachmentService, 'findOne').mockImplementation(((
        criteria,
      ) => {
        return criteria !== '9'.repeat(24)
          ? Promise.reject('Invalid ID')
          : Promise.resolve({
              id: '9'.repeat(24),
              resourceRef: AttachmentResourceRef.UserAvatar,
            } as AttachmentOrmEntity);
      }) as any);

      jest.spyOn(modelService, 'findOne').mockImplementation((({ where }) => {
        return typeof where === 'string' ||
          !['user', 'attachment'].includes(where.identity)
          ? Promise.reject('Invalid #1')
          : Promise.resolve({
              identity: where.identity,
              id: `${where.identity}-id`,
            } as Model);
      }) as any);

      jest.spyOn(permissionService, 'findOne').mockImplementation(((
        criteria,
      ) => {
        const roleIds = criteria?.roleId?.$in ?? [];
        return typeof criteria !== 'object' ||
          !Array.isArray(roleIds) ||
          !roleIds.includes('admin-id') ||
          criteria.modelId !== 'user-id' ||
          criteria.action !== Action.READ
          ? Promise.reject('Invalid #2')
          : Promise.resolve({
              modelId: criteria.modelId,
              action: Action.READ,
              roleId: 'admin-id',
            } as unknown as Permission);
      }) as any);

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            params: { id: '9'.repeat(24) },
            method: 'GET',
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow POST requests with a valid ref', async () => {
      const mockUser = { roles: ['editor-id'] } as any;

      jest.spyOn(modelService, 'findOne').mockImplementation((({ where }) => {
        return typeof where === 'string' ||
          !['block', 'attachment'].includes(where.identity)
          ? Promise.reject()
          : Promise.resolve({
              identity: where.identity,
              id: `${where.identity}-id`,
            } as Model);
      }) as any);

      jest.spyOn(permissionService, 'findOne').mockImplementation(((
        criteria,
      ) => {
        const roleIds = criteria?.roleId?.$in ?? [];
        const isBlockUpdate =
          criteria.modelId === 'block-id' && criteria.action === Action.UPDATE;
        const isAttachmentCreate =
          criteria.modelId === 'attachment-id' &&
          criteria.action === Action.CREATE;

        return typeof criteria !== 'object' ||
          !Array.isArray(roleIds) ||
          !roleIds.includes('editor-id') ||
          (!isBlockUpdate && !isAttachmentCreate)
          ? Promise.reject('Invalid #2')
          : Promise.resolve({
              modelId: criteria.modelId,
              action: criteria.action,
              roleId: 'editor-id',
            } as unknown as Permission);
      }) as any);

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            query: { resourceRef: AttachmentResourceRef.BlockAttachment },
            method: 'POST',
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException for DELETE requests with invalid attachment ID', async () => {
      jest.spyOn(attachmentService, 'findOne').mockResolvedValue(null);

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'DELETE',
            params: { id: '9'.repeat(24) },
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow DELETE requests with valid attachment and context', async () => {
      const mockUser = { roles: ['admin-id'] } as any;

      jest.spyOn(attachmentService, 'findOne').mockResolvedValue(attachment);

      jest.spyOn(modelService, 'findOne').mockImplementation((({ where }) => {
        return typeof where === 'string' ||
          !['block', 'attachment'].includes(where.identity)
          ? Promise.reject('Invalid X')
          : Promise.resolve({
              identity: where.identity,
              id: `${where.identity}-id`,
            } as Model);
      }) as any);

      jest.spyOn(permissionService, 'findOne').mockImplementation(((
        criteria,
      ) => {
        const roleIds = criteria?.roleId?.$in ?? [];
        const isBlockUpdate =
          criteria.modelId === 'block-id' && criteria.action === Action.UPDATE;
        const isAttachmentDelete =
          criteria.modelId === 'attachment-id' &&
          criteria.action === Action.DELETE;

        return typeof criteria !== 'object' ||
          !Array.isArray(roleIds) ||
          !roleIds.includes('admin-id') ||
          (!isBlockUpdate && !isAttachmentDelete)
          ? Promise.reject('Invalid Y')
          : Promise.resolve({
              modelId: criteria.modelId,
              action: criteria.action,
              roleId: 'admin-id',
            } as unknown as Permission);
      }) as any);

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'DELETE',
            params: { id: attachment.id },
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw BadRequestException for unsupported HTTP methods', async () => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'PUT',
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
