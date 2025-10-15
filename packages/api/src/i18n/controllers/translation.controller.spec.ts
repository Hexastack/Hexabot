/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';

import { NOT_FOUND_ID } from '@/utils/constants/mock';
import { installLanguageFixturesTypeOrm } from '@/utils/test/fixtures/language';
import {
  installTranslationFixturesTypeOrm,
  translationFixtures,
} from '@/utils/test/fixtures/translation';
import { getPageQuery } from '@/utils/test/pagination';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { getModelToken } from '@nestjs/mongoose';

import { BlockRepository } from '@/chat/repositories/block.repository';
import { ConversationRepository } from '@/chat/repositories/conversation.repository';
import { Block } from '@/chat/schemas/block.schema';
import { Conversation } from '@/chat/schemas/conversation.schema';
import { BlockService } from '@/chat/services/block.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';

import { TranslationUpdateDto } from '../dto/translation.dto';
import { Language } from '../entities/language.entity';
import { Translation } from '../entities/translation.entity';
import { I18nService } from '../services/i18n.service';
import { LanguageRepository } from '../repositories/language.repository';
import { TranslationRepository } from '../repositories/translation.repository';
import { LanguageService } from '../services/language.service';
import { TranslationService } from '../services/translation.service';

import { TranslationController } from './translation.controller';

describe('TranslationController', () => {
  let translationController: TranslationController;
  let translationService: TranslationService;
  let translation: Translation;

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
        {
          provide: getModelToken(Block.name),
          useValue: {},
        },
        {
          provide: getModelToken(Conversation.name),
          useValue: {},
        },
      ],
      typeorm: [
        {
          entities: [Translation],
          fixtures: installTranslationFixturesTypeOrm,
        },
        {
          entities: [Language],
          fixtures: installLanguageFixturesTypeOrm,
        },
      ],
    });
    [translationService, translationController] = await getMocks([
      TranslationService,
      TranslationController,
    ]);
    translation = (await translationService.findOne({
      str: 'Welcome',
    })) as Translation;
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
        ) as Translation,
      );
    });
  });

  describe('find', () => {
    const pageQuery = getPageQuery<Translation>();
    it('should find translations', async () => {
      jest.spyOn(translationService, 'find');
      const result = await translationController.findPage(pageQuery, {});

      expect(translationService.find).toHaveBeenCalledWith({}, pageQuery);
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
