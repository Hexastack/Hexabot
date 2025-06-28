/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

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
import { Translation } from '../schemas/translation.schema';
import { I18nService } from '../services/i18n.service';
import { TranslationService } from '../services/translation.service';

import { TranslationController } from './translation.controller';

describe('TranslationController', () => {
  let translationController: TranslationController;
  let translationService: TranslationService;
  let translation: Translation;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [TranslationController],
      imports: [rootMongooseTestModule(installTranslationFixtures)],
      providers: [
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
            refreshDynamicTranslations: jest.fn(),
          },
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
      ).rejects.toThrow(getUpdateOneError(Translation.name, NOT_FOUND_ID));
    });
  });
});
