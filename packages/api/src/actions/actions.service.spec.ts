/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerModule } from '@/logger/logger.module';
import { DummyAction } from '@/utils/test/dummy/dummy.action';
import { buildTestingMocks } from '@/utils/test/utils';

import { ActionService } from './actions.service';
import { BaseAction } from './base-action';

describe('ActionService', () => {
  let actionService: ActionService;
  let dummyAction: InstanceType<typeof DummyAction>;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      providers: [ActionService, DummyAction],
      imports: [LoggerModule],
    });
    [actionService, dummyAction] = await getMocks([ActionService, DummyAction]);
    await dummyAction.onModuleInit();
  });

  afterAll(jest.clearAllMocks);

  it('should return all registered actions', () => {
    const actions = actionService.getAll();
    expect(actions.every((action) => action instanceof BaseAction)).toBe(true);
  });

  it('should fetch an action by name', () => {
    const action = actionService.get('dummy_action');
    expect(action).toBeInstanceOf(DummyAction);
  });
});
