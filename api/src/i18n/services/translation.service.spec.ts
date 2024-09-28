/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { I18nService } from '@/i18n/services/i18n.service';
import { Settings } from '@/setting/schemas/types';
import { SettingService } from '@/setting/services/setting.service';

import { Block } from '../../chat/schemas/block.schema';
import { BlockOptions } from '../../chat/schemas/types/options';
import { BlockService } from '../../chat/services/block.service';
import { TranslationRepository } from '../repositories/translation.repository';
import { TranslationService } from '../services/translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let settingService: SettingService;
  let i18nService: I18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationService,
        {
          provide: TranslationRepository,
          useValue: {
            findAll: jest.fn().mockResolvedValue([
              {
                key: 'test',
                value: 'test',
                lang: 'en',
              },
            ]),
          },
        },
        {
          provide: BlockService,
          useValue: {
            find: jest.fn().mockResolvedValue([
              {
                id: 'blockId',
                message: ['Test message'],
                options: {
                  fallback: {
                    message: ['Fallback message'],
                  },
                },
              } as Block,
            ]),
          },
        },
        {
          provide: SettingService,
          useValue: {
            getSettings: jest.fn().mockResolvedValue({
              chatbot_settings: {
                global_fallback: true,
                fallback_message: ['Global fallback message'],
              },
            } as Settings),
          },
        },
        {
          provide: I18nService,
          useValue: {
            refreshDynamicTranslations: jest.fn(),
          },
        },
        EventEmitter2,
      ],
    }).compile();

    service = module.get<TranslationService>(TranslationService);
    settingService = module.get<SettingService>(SettingService);
    i18nService = module.get<I18nService>(I18nService);
  });

  it('should call refreshDynamicTranslations with translations from findAll', async () => {
    jest.spyOn(i18nService, 'refreshDynamicTranslations');
    await service.resetI18nTranslations();
    expect(i18nService.refreshDynamicTranslations).toHaveBeenCalledWith([
      {
        key: 'test',
        value: 'test',
        lang: 'en',
      },
    ]);
  });

  it('should return an array of strings from all blocks', async () => {
    const strings = await service.getAllBlockStrings();
    expect(strings).toEqual(['Test message', 'Fallback message']);
  });

  it('should return an array of strings from the settings when global fallback is enabled', async () => {
    const strings = await service.getSettingStrings();
    expect(strings).toEqual(['Global fallback message']);
  });

  it('should return an empty array from the settings when global fallback is disabled', async () => {
    jest.spyOn(settingService, 'getSettings').mockResolvedValueOnce({
      chatbot_settings: {
        global_fallback: false,
        fallback_message: ['Global fallback message'],
      },
    } as Settings);

    const strings = await service.getSettingStrings();
    expect(strings).toEqual([]);
  });

  it('should return an array of strings from a block with a quick reply message', () => {
    const block = {
      id: 'blockId',
      name: 'Test Block',
      category: 'Test Category',
      position: { x: 0, y: 0 },
      message: {
        text: 'Test message',
        quickReplies: [
          {
            title: 'Quick reply 1',
          },
          {
            title: 'Quick reply 2',
          },
        ],
      },
      options: {
        fallback: {
          active: true,
          message: ['Fallback message'],
          max_attempts: 3,
        } as BlockOptions,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Block;
    const strings = service.getBlockStrings(block);
    expect(strings).toEqual([
      'Test message',
      'Quick reply 1',
      'Quick reply 2',
      'Fallback message',
    ]);
  });

  it('should return an array of strings from a block with a button message', () => {
    const block = {
      id: 'blockId',
      name: 'Test Block',
      category: 'Test Category',
      position: { x: 0, y: 0 },
      message: {
        text: 'Test message',
        buttons: [
          {
            title: 'Button 1',
          },
          {
            title: 'Button 2',
          },
        ],
      },
      options: {
        fallback: {
          active: true,
          message: ['Fallback message'],
          max_attempts: 3,
        } as BlockOptions,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Block;
    const strings = service.getBlockStrings(block);
    expect(strings).toEqual([
      'Test message',
      'Button 1',
      'Button 2',
      'Fallback message',
    ]);
  });

  it('should return an array of strings from a block with a text message', () => {
    const block = {
      id: 'blockId',
      name: 'Test Block',
      category: 'Test Category',
      position: { x: 0, y: 0 },
      message: ['Test message'], // Text message as an array
      options: {
        fallback: {
          active: true,
          message: ['Fallback message'],
          max_attempts: 3,
        } as BlockOptions,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Block;
    const strings = service.getBlockStrings(block);
    expect(strings).toEqual(['Test message', 'Fallback message']);
  });

  it('should return an array of strings from a block with a nested message object', () => {
    const block = {
      id: 'blockId',
      name: 'Test Block',
      category: 'Test Category',
      position: { x: 0, y: 0 },
      message: {
        text: 'Test message', // Nested text message
      },
      options: {
        fallback: {
          active: true,
          message: ['Fallback message'],
          max_attempts: 3,
        } as BlockOptions,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Block;
    const strings = service.getBlockStrings(block);
    expect(strings).toEqual(['Test message', 'Fallback message']);
  });

  it('should handle different message formats in getBlockStrings', () => {
    // Covers lines 54-60, 65

    // Test with an array message (line 54-57)
    const block1 = {
      id: 'blockId1',
      message: ['This is a text message'],
      options: { fallback: { message: ['Fallback message'] } },
    } as Block;
    const strings1 = service.getBlockStrings(block1);
    expect(strings1).toEqual(['This is a text message', 'Fallback message']);

    // Test with an object message (line 58-60)
    const block2 = {
      id: 'blockId2',
      message: { text: 'Another text message' },
      options: { fallback: { message: ['Fallback message'] } },
    } as Block;
    const strings2 = service.getBlockStrings(block2);
    expect(strings2).toEqual(['Another text message', 'Fallback message']);

    // Test a block without a fallback (line 65)
    const block3 = {
      id: 'blockId3',
      message: { text: 'Another test message' },
      options: {},
    } as Block;
    const strings3 = service.getBlockStrings(block3);
    expect(strings3).toEqual(['Another test message']);
  });
});
