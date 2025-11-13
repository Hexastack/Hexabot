/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SettingService } from '@hexabot/setting/services/setting.service';
import { NotFoundException } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { BlockRepository } from '@/chat/repositories/block.repository';
import { ConversationRepository } from '@/chat/repositories/conversation.repository';
import { BlockService } from '@/chat/services/block.service';
import { PluginService } from '@/plugins/plugins.service';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
import { installLanguageFixturesTypeOrm } from '@hexabot/dev/fixtures/language';
import {
  installTranslationFixturesTypeOrm,
  translationFixtures,
} from '@hexabot/dev/fixtures/translation';
import { closeTypeOrmConnections } from '@hexabot/dev/test';
import { buildTestingMocks } from '@hexabot/dev/utils';

import { TranslationUpdateDto } from '../dto/translation.dto';
import { LanguageOrmEntity } from '../entities/language.entity';
import { TranslationOrmEntity } from '../entities/translation.entity';
import { LanguageRepository } from '../repositories/language.repository';
import { TranslationRepository } from '../repositories/translation.repository';
import { I18nService } from '../services/i18n.service';
import { LanguageService } from '../services/language.service';
import { TranslationService } from '../services/translation.service';

import { TranslationController } from './translation.controller';

describe('TranslationController', () => {
  let translationController: TranslationController;
  let translationService: TranslationService;
  let translation: TranslationOrmEntity;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      controllers: [TranslationController],
      providers: [
        TranslationService,
        TranslationRepository,
        LanguageService,
        LanguageRepository,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
            refreshDynamicTranslations: jest.fn(),
          },
        },
        {
          provide: BlockService,
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: BlockRepository,
          useValue: {
            find: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: ConversationRepository,
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: SettingService,
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            getSettings: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: PluginService,
          useValue: {
            getPlugin: jest.fn(),
          },
        },
      ],
      typeorm: [
        {
          entities: [TranslationOrmEntity],
          fixtures: installTranslationFixturesTypeOrm,
        },
        {
          entities: [LanguageOrmEntity],
          fixtures: installLanguageFixturesTypeOrm,
        },
      ],
    });
    [translationService, translationController] = await getMocks([
      TranslationService,
      TranslationController,
    ]);
    translation = (await translationService.findOne({
      where: { str: 'Welcome' },
    })) as TranslationOrmEntity;
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeTypeOrmConnections);

  describe('count', () => {
    it('should count translations', async () => {
      jest.spyOn(translationService, 'count');
      const result = await translationController.filterCount();

      expect(translationService.count).toHaveBeenCalled();
      expect(result).toEqual({ count: translationFixtures.length });
    });
  });

  describe('findOne', () => {
    it('should find one translation by id', async () => {
      jest.spyOn(translationService, 'findOne');
      const result = await translationController.findOne(translation.id);

      expect(translationService.findOne).toHaveBeenCalledWith(translation.id);
      expect(result).toEqualPayload(
        translationFixtures.find(
          ({ str }) => str === translation.str,
        ) as TranslationOrmEntity,
      );
    });
  });

  describe('find', () => {
    it('should find translations', async () => {
      jest.spyOn(translationService, 'find');
      const options: FindManyOptions<TranslationOrmEntity> = {};
      const result = await translationController.findPage(options);

      expect(translationService.find).toHaveBeenCalledWith(options);
      expect(result).toEqualPayload(translationFixtures);
    });
  });

  describe('updateOne', () => {
    const translationUpdateDto: TranslationUpdateDto = {
      str: 'Welcome !',
    };
    it('should update one translation by id', async () => {
      jest.spyOn(translationService, 'updateOne');
      const result = await translationController.updateOne(
        translation.id,
        translationUpdateDto,
      );

      expect(translationService.updateOne).toHaveBeenCalledWith(
        translation.id,
        translationUpdateDto,
      );
      expect(result).toEqualPayload({
        ...translationFixtures.find(({ str }) => str === translation.str),
        ...translationUpdateDto,
      });
    });

    it('should throw a NotFoundException when attempting to update a translation by id', async () => {
      jest.spyOn(translationService, 'updateOne');
      await expect(
        translationController.updateOne(NOT_FOUND_ID, translationUpdateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
