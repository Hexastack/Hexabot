/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
