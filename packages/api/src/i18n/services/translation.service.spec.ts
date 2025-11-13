/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SettingService } from '@hexabot/setting/services/setting.service';
import { SettingType } from '@hexabot/setting/types';

import { BlockOptions } from '@/chat/types/options';
import { I18nService } from '@/i18n/services/i18n.service';
import { BasePlugin } from '@/plugins/base-plugin.service';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate } from '@/plugins/types';
import { buildTestingMocks } from '@hexabot/dev/utils';

import { Block } from '../../chat/dto/block.dto';
import { BlockService } from '../../chat/services/block.service';
import { TranslationRepository } from '../repositories/translation.repository';
import { TranslationService } from '../services/translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let i18nService: I18nService<unknown>;
  let pluginService: PluginService;

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
          provide: PluginService,
          useValue: {
            getPlugin: jest.fn(),
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
            }),
            find: jest
              .fn()
              .mockImplementation((criteria: { translatable?: boolean }) =>
                [
                  {
                    translatable: true,
                    group: 'default',
                    value: 'Global fallback message',
                    label: 'fallback_message',
                    type: SettingType.text,
                  },
                ].filter((s) =>
                  criteria && 'translatable' in criteria
                    ? s.translatable === criteria.translatable
                    : true,
                ),
              ),
          },
        },
        {
          provide: I18nService,
          useValue: {
            refreshDynamicTranslations: jest.fn(),
          },
        },
      ],
    });
    [service, i18nService, pluginService] = await getMocks([
      TranslationService,
      I18nService,
      PluginService,
    ]);
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

  it('should return plugin-related strings from block message with translatable args', async () => {
    const block: Block = {
      name: 'Ollama Plugin',
      patterns: [],
      outcomes: [],
      assign_labels: [],
      trigger_channels: [],
      trigger_labels: [],
      nextBlocks: [],
      category: '51b4f7d2-ff67-433d-9c02-1f2345678901',
      starts_conversation: false,
      builtin: false,
      capture_vars: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      id: '51b4f7d2-ff67-433d-9c02-1f2345678902',
      position: { x: 702, y: 321.8333282470703 },
      message: {
        plugin: 'ollama-plugin',
        args: {
          model: 'String 1',
          context: ['String 2', 'String 3'],
        },
      },
      options: {},
      attachedBlock: null,
    };

    class MockPlugin extends BasePlugin {
      template: PluginBlockTemplate = { name: 'Ollama Plugin' };

      name: `${string}-plugin`;

      type: any;

      private settings: {
        label: string;
        group: string;
        type: SettingType;
        value: any;
        translatable: boolean;
      }[];

      constructor() {
        super('ollama-plugin', pluginService);
        this.name = 'ollama-plugin';
        this.type = 'block';
        this.settings = [
          {
            label: 'model',
            group: 'default',
            type: SettingType.text,
            value: 'llama3.2',
            translatable: false,
          },
          {
            label: 'context',
            group: 'default',
            type: SettingType.multiple_text,
            value: ['Answer the user QUESTION using the DOCUMENTS text above.'],
            translatable: true,
          },
        ];
      }

      // Implementing the 'getPath' method (with a mock return value)
      getPath() {
        // Return a mock path
        return '/mock/path';
      }

      async getDefaultSettings() {
        return this.settings;
      }
    }

    // Create an instance of the mock plugin
    const mockedPlugin = new MockPlugin();

    jest
      .spyOn(pluginService, 'getPlugin')
      .mockImplementation(() => mockedPlugin);

    const result = await service.getBlockStrings(block);
    expect(result).toEqual(['String 2', 'String 3']);
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
