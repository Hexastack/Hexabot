/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { ContentRepository } from '@/cms/repositories/content.repository';
import { MenuRepository } from '@/cms/repositories/menu.repository';
import { ContentModel } from '@/cms/schemas/content.schema';
import { MenuModel } from '@/cms/schemas/menu.schema';
import { ContentService } from '@/cms/services/content.service';
import { MenuService } from '@/cms/services/menu.service';
import { ExtendedI18nService } from '@/extended-i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
import {
  installTranslationFixtures,
  translationFixtures,
} from '@/utils/test/fixtures/translation';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { MessageController } from './message.controller';
import { TranslationController } from './translation.controller';
import { TranslationUpdateDto } from '../dto/translation.dto';
import { BlockRepository } from '../repositories/block.repository';
import { MessageRepository } from '../repositories/message.repository';
import { SubscriberRepository } from '../repositories/subscriber.repository';
import { TranslationRepository } from '../repositories/translation.repository';
import { BlockModel } from '../schemas/block.schema';
import { MessageModel } from '../schemas/message.schema';
import { SubscriberModel } from '../schemas/subscriber.schema';
import { Translation, TranslationModel } from '../schemas/translation.schema';
import { BlockService } from '../services/block.service';
import { MessageService } from '../services/message.service';
import { SubscriberService } from '../services/subscriber.service';
import { TranslationService } from '../services/translation.service';

describe('TranslationController', () => {
  let translationController: TranslationController;
  let translationService: TranslationService;
  let translation: Translation;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MessageController],
      imports: [
        rootMongooseTestModule(installTranslationFixtures),
        MongooseModule.forFeature([
          SubscriberModel,
          TranslationModel,
          MessageModel,
          AttachmentModel,
          MenuModel,
          BlockModel,
          ContentModel,
        ]),
      ],
      providers: [
        TranslationController,
        TranslationService,
        TranslationRepository,
        MessageService,
        MessageRepository,
        SubscriberService,
        SubscriberRepository,
        ChannelService,
        AttachmentService,
        AttachmentRepository,
        MenuService,
        MenuRepository,
        {
          provide: NlpService,
          useValue: {
            getNLP: jest.fn(() => undefined),
          },
        },
        {
          provide: SettingService,
          useValue: {
            getConfig: jest.fn(() => ({
              chatbot: { lang: { default: 'fr' } },
            })),
            getSettings: jest.fn(() => ({})),
          },
        },
        BlockService,
        BlockRepository,
        ContentService,
        ContentRepository,
        {
          provide: PluginService,
          useValue: {},
        },
        EventEmitter2,
        LoggerService,
        {
          provide: ExtendedI18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
            initDynamicTranslations: jest.fn(),
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
      ],
    }).compile();
    translationService = module.get<TranslationService>(TranslationService);
    translationController = module.get<TranslationController>(
      TranslationController,
    );
    translation = await translationService.findOne({ str: 'Welcome' });
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

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
        translationFixtures.find(({ str }) => str === translation.str),
      );
    });
  });

  describe('findPage', () => {
    const pageQuery = getPageQuery<Translation>();
    it('should find translations', async () => {
      jest.spyOn(translationService, 'findPage');
      const result = await translationController.findPage(pageQuery, {});

      expect(translationService.findPage).toHaveBeenCalledWith({}, pageQuery);
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
