/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';

import {
  BadRequestException,
  MethodNotAllowedException,
} from '@nestjs/common/exceptions';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Request } from 'express';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import LocalStorageHelper from '@/extensions/helpers/local-storage/index.helper';
import { HelperService } from '@/helper/helper.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { ModelService } from '@/user/services/model.service';
import { PermissionService } from '@/user/services/permission.service';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import {
  attachmentFixtures,
  installAttachmentFixturesTypeOrm,
} from '@/utils/test/fixtures/attachment';
import { installSettingFixturesTypeOrm } from '@/utils/test/fixtures/setting';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Attachment } from '../dto/attachment.dto';
import { attachment, attachmentFile } from '../mocks/attachment.mock';
import { AttachmentService } from '../services/attachment.service';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '../types';

import { AttachmentController } from './attachment.controller';

describe('AttachmentController', () => {
  let attachmentController: AttachmentController;
  let attachmentService: AttachmentService;
  let attachmentToDelete: Attachment;
  let helperService: HelperService;
  let settingService: SettingService;

  beforeAll(async () => {
    const { getMocks, resolveMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [AttachmentController],
      providers: [
        {
          provide: PermissionService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: ModelService,
          useValue: { findOne: jest.fn() },
        },
      ],
      typeorm: {
        entities: [AttachmentOrmEntity],
        fixtures: [
          installSettingFixturesTypeOrm,
          installAttachmentFixturesTypeOrm,
        ],
      },
    });
    [attachmentController, attachmentService, helperService, settingService] =
      await getMocks([
        AttachmentController,
        AttachmentService,
        HelperService,
        SettingService,
      ]);
    const [loggerService] = await resolveMocks([LoggerService]);

    attachmentToDelete = (await attachmentService.findOne({
      where: {
        name: 'store1.jpg',
      },
    }))!;

    helperService.register(
      new LocalStorageHelper(settingService, helperService, loggerService),
    );
  });

  afterAll(async () => {
    await closeTypeOrmConnections();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('findPage', () => {
    it('should forward TypeORM options to the service', async () => {
      const findSpy = jest.spyOn(attachmentService, 'find');
      const name = attachmentFixtures[0].name;

      const options = {
        where: { name },
        take: 5,
        skip: 0,
      };
      const result = await attachmentController.findPage(options);

      expect(findSpy).toHaveBeenCalledWith(options);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name,
        type: attachmentFixtures[0].type,
        resourceRef: attachmentFixtures[0].resourceRef,
        access: attachmentFixtures[0].access,
      });
    });
  });

  describe('count', () => {
    it('should count attachments', async () => {
      const countSpy = jest.spyOn(attachmentService, 'count');
      const name = attachmentFixtures[0].name;

      const result = await attachmentController.filterCount({
        where: { name },
      });

      expect(countSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name },
        }),
      );
      expect(result.count).toBe(1);
    });
  });

  describe('Upload', () => {
    it('should throw BadRequestException if no file is selected to be uploaded', async () => {
      const promiseResult = attachmentController.uploadFile(
        {
          file: [],
        },
        {} as Request,
        { resourceRef: AttachmentResourceRef.BlockAttachment },
      );
      await expect(promiseResult).rejects.toThrow(
        new BadRequestException('No file was selected'),
      );
    });

    it('should upload attachment', async () => {
      jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

      jest.spyOn(attachmentService, 'create');
      const result = await attachmentController.uploadFile(
        {
          file: [attachmentFile],
        },
        {
          session: { passport: { user: { id: '9'.repeat(24) } } },
        } as unknown as Request,
        { resourceRef: AttachmentResourceRef.BlockAttachment },
      );
      const [name] = attachmentFile.filename.split('.');
      expect(attachmentService.create).toHaveBeenCalledWith({
        size: attachmentFile.size,
        type: attachmentFile.mimetype,
        name: attachmentFile.originalname,
        location: expect.stringMatching(new RegExp(`^/${name}`)),
        resourceRef: AttachmentResourceRef.BlockAttachment,
        access: AttachmentAccess.Public,
        createdByRef: AttachmentCreatedByRef.User,
        createdBy: '9'.repeat(24),
      });
      expect(result).toEqualPayload(
        [
          {
            ...attachment,
            resourceRef: AttachmentResourceRef.BlockAttachment,
            createdByRef: AttachmentCreatedByRef.User,
            createdBy: '9'.repeat(24),
          },
        ],
        [...IGNORED_TEST_FIELDS, 'location', 'url', 'channel'],
      );
    });
  });

  describe('Download', () => {
    it(`should throw NotFoundException the id or/and file don't exist`, async () => {
      jest.spyOn(attachmentService, 'findOne');
      const result = attachmentController.download({ id: NOT_FOUND_ID });
      expect(attachmentService.findOne).toHaveBeenCalledWith(NOT_FOUND_ID);
      expect(result).rejects.toThrow(
        new NotFoundException('Attachment not found'),
      );
    });

    it('should download the attachment by id', async () => {
      jest.spyOn(attachmentService, 'findOne');
      const storedAttachment = (await attachmentService.findOne({
        where: {
          name: 'store1.jpg',
        },
      }))!;
      const result = await attachmentController.download({
        id: storedAttachment.id,
      });

      expect(attachmentService.findOne).toHaveBeenCalledWith(
        storedAttachment.id,
      );
      expect(result?.options).toEqual({
        type: storedAttachment.type,
        disposition: `attachment; filename="${encodeURIComponent(
          storedAttachment.name,
        )}"`,
      });
    });
  });

  describe('deleteOne', () => {
    it('should throw a MethodNotAllowedException when attempting to delete an attachment by id', async () => {
      await expect(
        attachmentController.deleteOne(attachmentToDelete.id),
      ).rejects.toThrow(MethodNotAllowedException);
    });
  });
});
