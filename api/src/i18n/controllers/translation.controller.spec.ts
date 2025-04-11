/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { MessageController } from '@/chat/controllers/message.controller';
import { BlockRepository } from '@/chat/repositories/block.repository';
import { MessageRepository } from '@/chat/repositories/message.repository';
import { SubscriberRepository } from '@/chat/repositories/subscriber.repository';
import { BlockModel } from '@/chat/schemas/block.schema';
import { MessageModel } from '@/chat/schemas/message.schema';
import { SubscriberModel } from '@/chat/schemas/subscriber.schema';
import { BlockService } from '@/chat/services/block.service';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { ContentRepository } from '@/cms/repositories/content.repository';
import { MenuRepository } from '@/cms/repositories/menu.repository';
import { ContentModel } from '@/cms/schemas/content.schema';
import { MenuModel } from '@/cms/schemas/menu.schema';
import { ContentService } from '@/cms/services/content.service';
import { MenuService } from '@/cms/services/menu.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
import { getUpdateOneError } from '@/utils/test/errors/messages';
import {
  installTranslationFixtures,
  translationFixtures,
} from '@/utils/test/fixtures/translation';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { TranslationUpdateDto } from '../dto/translation.dto';
import { LanguageRepository } from '../repositories/language.repository';
import { TranslationRepository } from '../repositories/translation.repository';
import { LanguageModel } from '../schemas/language.schema';
import { Translation, TranslationModel } from '../schemas/translation.schema';
import { LanguageService } from '../services/language.service';
import { TranslationService } from '../services/translation.service';

import { TranslationController } from './translation.controller';

describe('TranslationController', () => {
  let translationController: TranslationController;
  let translationService: TranslationService;
  let translation: Translation;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
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
          LanguageModel,
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
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
            refreshDynamicTranslations: jest.fn(),
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
        LanguageService,
        LanguageRepository,
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
        translationFixtures.find(
          ({ str }) => str === translation.str,
        ) as Translation,
      );
    });
  });

  describe('findPage', () => {
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
      ).rejects.toThrow(getUpdateOneError(Translation.name, NOT_FOUND_ID));
    });
  });
});
