/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BadRequestException, ExecutionContext } from '@nestjs/common';

import { Model } from '@/user/schemas/model.schema';
import { Permission } from '@/user/schemas/permission.schema';
import { ModelService } from '@/user/services/model.service';
import { PermissionService } from '@/user/services/permission.service';
import { Action } from '@/user/types/action.type';
import { buildTestingMocks } from '@/utils/test/utils';

import { attachment } from '../mocks/attachment.mock';
import { Attachment } from '../schemas/attachment.schema';
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

      jest.spyOn(modelService, 'findOne').mockImplementation((criteria) => {
        return typeof criteria === 'string' ||
          !['user', 'attachment'].includes(criteria.identity)
          ? Promise.reject('Invalid #1')
          : Promise.resolve({
              identity: criteria.identity,
              id: `${criteria.identity}-id`,
            } as Model);
      });

      jest
        .spyOn(permissionService, 'findOne')
        .mockImplementation((criteria) => {
          return typeof criteria === 'string' ||
            !['user-id', 'attachment-id'].includes(criteria.model) ||
            criteria.action !== Action.READ
            ? Promise.reject('Invalid #2')
            : Promise.resolve({
                model: criteria.model,
                action: Action.READ,
                role: 'admin-id',
              } as Permission);
        });

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

      jest
        .spyOn(attachmentService, 'findOne')
        .mockImplementation((criteria) => {
          return criteria !== '9'.repeat(24)
            ? Promise.reject('Invalid ID')
            : Promise.resolve({
                id: '9'.repeat(24),
                resourceRef: AttachmentResourceRef.UserAvatar,
              } as Attachment);
        });

      jest.spyOn(modelService, 'findOne').mockImplementation((criteria) => {
        return typeof criteria === 'string' ||
          !['user', 'attachment'].includes(criteria.identity)
          ? Promise.reject('Invalid #1')
          : Promise.resolve({
              identity: criteria.identity,
              id: `${criteria.identity}-id`,
            } as Model);
      });

      jest
        .spyOn(permissionService, 'findOne')
        .mockImplementation((criteria) => {
          return typeof criteria === 'string' ||
            !['user-id', 'attachment-id'].includes(criteria.model) ||
            criteria.action !== Action.READ
            ? Promise.reject('Invalid #2')
            : Promise.resolve({
                model: criteria.model,
                action: Action.READ,
                role: 'admin-id',
              } as Permission);
        });

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

      jest.spyOn(modelService, 'findOne').mockImplementation((criteria) => {
        return typeof criteria === 'string' ||
          !['block', 'attachment'].includes(criteria.identity)
          ? Promise.reject()
          : Promise.resolve({
              identity: criteria.identity,
              id: `${criteria.identity}-id`,
            } as Model);
      });

      jest
        .spyOn(permissionService, 'findOne')
        .mockImplementation((criteria) => {
          return typeof criteria === 'string' ||
            !['block-id', 'attachment-id'].includes(criteria.model)
            ? Promise.reject()
            : Promise.resolve({
                model: criteria.model,
                action: Action.CREATE,
                role: 'editor-id',
              } as Permission);
        });

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
            params: { id: 'invalid-id' },
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow DELETE requests with valid attachment and context', async () => {
      const mockUser = { roles: ['admin-id'] } as any;

      jest.spyOn(attachmentService, 'findOne').mockResolvedValue(attachment);

      jest.spyOn(modelService, 'findOne').mockImplementation((criteria) => {
        return typeof criteria === 'string' ||
          !['block', 'attachment'].includes(criteria.identity)
          ? Promise.reject('Invalid X')
          : Promise.resolve({
              identity: criteria.identity,
              id: `${criteria.identity}-id`,
            } as Model);
      });

      jest
        .spyOn(permissionService, 'findOne')
        .mockImplementation((criteria) => {
          return typeof criteria === 'string' ||
            !['block-id', 'attachment-id'].includes(criteria.model) ||
            (criteria.model === 'block-id' &&
              criteria.action !== Action.UPDATE) ||
            (criteria.model === 'attachment-id' &&
              criteria.action !== Action.DELETE)
            ? Promise.reject('Invalid Y')
            : Promise.resolve({
                model: criteria.model,
                action: criteria.action,
                role: 'admin-id',
              } as Permission);
        });

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
