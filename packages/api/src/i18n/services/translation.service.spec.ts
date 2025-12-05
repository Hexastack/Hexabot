/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BlockOptions } from '@/chat/types/options';
import { I18nService } from '@/i18n/services/i18n.service';
import { SettingServiceProvider } from '@/utils/test/providers/setting-service.provider';
import { buildTestingMocks } from '@/utils/test/utils';

import { Block } from '../../chat/dto/block.dto';
import { BlockService } from '../../chat/services/block.service';
import { TranslationRepository } from '../repositories/translation.repository';
import { TranslationService } from '../services/translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let i18nService: I18nService<unknown>;

  beforeEach(async () => {
    const { getMocks } = await buildTestingMocks({
      providers: [
        TranslationService,
        {
          provide: TranslationRepository,
          useValue: {
            isFindOptions: jest.fn().mockReturnValue(false),
            getEventEmitter: jest.fn().mockReturnValue(undefined),
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
        SettingServiceProvider,
      ],
    });
    [service, i18nService] = await getMocks([TranslationService, I18nService]);
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

  it('should return the settings translation strings', async () => {
    const strings = await service.getSettingStrings();
    expect(strings).toEqual(['Global fallback message']);
  });

  it('should return an array of strings from a block with a quick reply message', async () => {
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
    const strings = await service.getBlockStrings(block);
    expect(strings).toEqual([
      'Test message',
      'Quick reply 1',
      'Quick reply 2',
      'Fallback message',
    ]);
  });

  it('should return an array of strings from a block with a button message', async () => {
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
    const strings = await service.getBlockStrings(block);
    expect(strings).toEqual([
      'Test message',
      'Button 1',
      'Button 2',
      'Fallback message',
    ]);
  });

  it('should return an array of strings from a block with a text message', async () => {
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
    const strings = await service.getBlockStrings(block);
    expect(strings).toEqual(['Test message', 'Fallback message']);
  });

  it('should return an array of strings from a block with a nested message object', async () => {
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
    const strings = await service.getBlockStrings(block);
    expect(strings).toEqual(['Test message', 'Fallback message']);
  });

  it('should handle different message formats in getBlockStrings', async () => {
    // Covers lines 54-60, 65

    // Test with an array message (line 54-57)
    const block1 = {
      id: 'blockId1',
      message: ['This is a text message'],
      options: { fallback: { message: ['Fallback message'] } },
    } as Block;
    const strings1 = await service.getBlockStrings(block1);
    expect(strings1).toEqual(['This is a text message', 'Fallback message']);

    // Test with an object message (line 58-60)
    const block2 = {
      id: 'blockId2',
      message: { text: 'Another text message' },
      options: { fallback: { message: ['Fallback message'] } },
    } as Block;
    const strings2 = await service.getBlockStrings(block2);
    expect(strings2).toEqual(['Another text message', 'Fallback message']);

    // Test a block without a fallback (line 65)
    const block3 = {
      id: 'blockId3',
      message: { text: 'Another test message' },
      options: {},
    } as Block;
    const strings3 = await service.getBlockStrings(block3);
    expect(strings3).toEqual(['Another test message']);
  });
});
