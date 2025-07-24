/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import fs from 'fs';

import {
  BadRequestException,
  MethodNotAllowedException,
} from '@nestjs/common/exceptions';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Request } from 'express';

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
  installAttachmentFixtures,
} from '@/utils/test/fixtures/attachment';
import { installSettingFixtures } from '@/utils/test/fixtures/setting';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { attachment, attachmentFile } from '../mocks/attachment.mock';
import { Attachment } from '../schemas/attachment.schema';
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
      imports: [
        rootMongooseTestModule(async () => {
          await installSettingFixtures();
          await installAttachmentFixtures();
        }),
      ],
      providers: [PermissionService, ModelService],
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
      name: 'store1.jpg',
    }))!;

    helperService.register(
      new LocalStorageHelper(settingService, helperService, loggerService),
    );
  });

  afterAll(closeInMongodConnection);

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('count', () => {
    it('should count attachments', async () => {
      jest.spyOn(attachmentService, 'count');
      const result = await attachmentController.filterCount();

      expect(attachmentService.count).toHaveBeenCalled();
      expect(result).toEqual({ count: attachmentFixtures.length });
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
        [...IGNORED_TEST_FIELDS, 'location', 'url'],
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
        name: 'store1.jpg',
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
