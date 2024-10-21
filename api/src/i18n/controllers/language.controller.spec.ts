/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
import {
  installLanguageFixtures,
  languageFixtures,
} from '@/utils/test/fixtures/language';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { LanguageUpdateDto } from '../dto/language.dto';
import { LanguageRepository } from '../repositories/language.repository';
import { Language, LanguageModel } from '../schemas/language.schema';
import { LanguageService } from '../services/language.service';

import { LanguageController } from './language.controller';

describe('LanguageController', () => {
  let languageController: LanguageController;
  let languageService: LanguageService;
  let language: Language;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installLanguageFixtures),
        MongooseModule.forFeature([LanguageModel]),
      ],
      providers: [
        LanguageController,
        LanguageService,
        LanguageRepository,
        LoggerService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
            initDynamicLanguages: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        LoggerService,
        EventEmitter2,
      ],
    }).compile();
    languageService = module.get<LanguageService>(LanguageService);
    languageController = module.get<LanguageController>(LanguageController);
    language = await languageService.findOne({ code: 'en' });
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('count', () => {
    it('should count languages', async () => {
      jest.spyOn(languageService, 'count');
      const result = await languageController.filterCount();

      expect(languageService.count).toHaveBeenCalled();
      expect(result).toEqual({ count: languageFixtures.length });
    });
  });

  describe('findOne', () => {
    it('should find one translation by id', async () => {
      jest.spyOn(languageService, 'findOne');
      const result = await languageController.findOne(language.id);

      expect(languageService.findOne).toHaveBeenCalledWith(language.id);
      expect(result).toEqualPayload(
        languageFixtures.find(({ code }) => code === language.code),
      );
    });
  });

  describe('findPage', () => {
    const pageQuery = getPageQuery<Language>({ sort: ['code', 'asc'] });
    it('should find languages', async () => {
      jest.spyOn(languageService, 'findPage');
      const result = await languageController.findPage(pageQuery, {});

      expect(languageService.findPage).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(
        languageFixtures.sort(({ code: codeA }, { code: codeB }) => {
          if (codeA < codeB) {
            return -1;
          }
          if (codeA > codeB) {
            return 1;
          }
          return 0;
        }),
      );
    });
  });

  describe('updateOne', () => {
    const translationUpdateDto: LanguageUpdateDto = {
      title: 'English (US)',
    };
    it('should update one language by id', async () => {
      jest.spyOn(languageService, 'updateOne');
      const result = await languageController.updateOne(
        language.id,
        translationUpdateDto,
      );

      expect(languageService.updateOne).toHaveBeenCalledWith(
        language.id,
        translationUpdateDto,
      );
      expect(result).toEqualPayload({
        ...languageFixtures.find(({ code }) => code === language.code),
        ...translationUpdateDto,
      });
    });

    it('should mark a language as default', async () => {
      jest.spyOn(languageService, 'updateOne');
      const translationUpdateDto = { isDefault: true };
      const frLang = await languageService.findOne({ code: 'fr' });
      const result = await languageController.updateOne(
        frLang.id,
        translationUpdateDto,
      );

      expect(languageService.updateOne).toHaveBeenCalledWith(
        frLang.id,
        translationUpdateDto,
      );
      expect(result).toEqualPayload({
        ...languageFixtures.find(({ code }) => code === frLang.code),
        ...translationUpdateDto,
      });

      const enLang = await languageService.findOne({ code: 'en' });
      expect(enLang.isDefault).toBe(false);
    });

    it('should throw a NotFoundException when attempting to update a translation by id', async () => {
      jest.spyOn(languageService, 'updateOne');
      await expect(
        languageController.updateOne(NOT_FOUND_ID, translationUpdateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOne', () => {
    it('should throw when attempting to delete the default language', async () => {
      const defaultLang = await languageService.findOne({ isDefault: true });

      await expect(
        languageController.deleteOne(defaultLang.id),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
