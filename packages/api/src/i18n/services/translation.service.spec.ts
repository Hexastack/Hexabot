/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { I18nService } from '@/i18n/services/i18n.service';
import { SettingServiceProvider } from '@/utils/test/providers/setting-service.provider';
import { buildTestingMocks } from '@/utils/test/utils';
import { Workflow } from '@/workflow/dto/workflow.dto';
import { WorkflowService } from '@/workflow/services/workflow.service';

import { TranslationRepository } from '../repositories/translation.repository';
import { TranslationService } from '../services/translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let i18nService: I18nService<unknown>;
  let workflowService: jest.Mocked<WorkflowService>;

  const workflowFixtures: Workflow[] = [
    {
      id: 'workflow-1',
      name: 'demo',
      version: '1.0.0',
      description: 'Workflow description',
      definition: {
        workflow: { description: 'Internal workflow description' },
        tasks: {
          send_text: {
            action: 'send_text_message',
            description: 'Send greeting',
            inputs: {
              text: 'Hello user',
              nested: { caption: 'Nested caption' },
            },
          },
        },
        flow: [{ do: 'send_text' }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Workflow,
    {
      id: 'workflow-2',
      name: 'secondary',
      version: '0.1.0',
      definition: {
        tasks: {
          ask_choice: {
            action: 'send_quick_replies',
            inputs: {
              title: 'Pick one',
              items: ['One', 'Two'],
            },
          },
        },
        flow: [{ do: 'ask_choice' }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Workflow,
  ];

  beforeEach(async () => {
    workflowService = {
      find: jest.fn().mockResolvedValue(workflowFixtures),
    } as unknown as jest.Mocked<WorkflowService>;

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
        { provide: WorkflowService, useValue: workflowService },
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

  it('should return an array of strings from all workflows', async () => {
    const strings = await service.getAllWorkflowStrings();

    expect(strings).toEqual(
      expect.arrayContaining([
        'Workflow description',
        'Internal workflow description',
        'Send greeting',
        'Hello user',
        'Nested caption',
        'Pick one',
        'One',
        'Two',
      ]),
    );
    expect(strings).not.toContain('send_text_message');
  });

  it('should return the settings translation strings', async () => {
    const strings = await service.getSettingStrings();
    expect(strings).toEqual(['Global fallback message']);
  });
});
