/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ModelDefinition } from '@nestjs/mongoose';

import { LifecycleHookManager } from './lifecycle-hook-manager';

afterEach(jest.clearAllMocks);

describe('LifecycleHookManager', () => {
  let modelMock: ModelDefinition;

  beforeEach(() => {
    // Mock ModelDefinition
    modelMock = {
      name: 'TestModel',
      schema: {
        pre: jest.fn(),
        post: jest.fn(),
      },
    } as unknown as ModelDefinition;
  });

  it('should attach pre and post hooks to the schema', () => {
    // Attach hooks
    const result = LifecycleHookManager.attach(modelMock);

    // Check if the hooks were attached
    expect(result).toEqual(modelMock);
    expect(modelMock.schema.pre).toHaveBeenCalledWith(
      'save',
      expect.any(Function),
    );
    expect(modelMock.schema.post).toHaveBeenCalledWith(
      'save',
      expect.any(Function),
    );
    // Similarly, you can check for other hooks
  });

  it('should return hooks attached to a specific model', () => {
    if (!LifecycleHookManager.getModel(modelMock.name)) {
      // Attach hooks to mock model
      LifecycleHookManager.attach(modelMock);
    }

    // Retrieve hooks
    const hooks = LifecycleHookManager.getHooks('TestModel');

    // Validate the hooks
    expect(hooks).toBeDefined();
    expect(hooks!.save).toBeDefined();
    expect(hooks!.deleteOne).toBeDefined();
  });

  it('should return undefined for unknown models', () => {
    // Ensure undefined is returned for models without attached hooks
    const hooks = LifecycleHookManager.getHooks('UnknownModel');
    expect(hooks).toBeUndefined();
  });
});
