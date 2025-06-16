/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition } from '@nestjs/mongoose';

enum LifecycleOperation {
  Validate = 'validate',
  Save = 'save',
  DeleteOne = 'deleteOne',
  DeleteMany = 'deleteMany',
  FindOneAndUpdate = 'findOneAndUpdate',
  //   InsertMany = 'insertMany',
  //   Update = 'update',
  //   UpdateOne = 'updateOne',
  UpdateMany = 'updateMany',
}

type PreHook = (...args: any[]) => void;
type PostHook = (...args: any[]) => void;

interface LifecycleHook {
  pre: PreHook & { execute: (newCallback: PreHook) => void };
  post: PostHook & { execute: (newCallback: PostHook) => void };
}

type LifecycleHooks = {
  [op in LifecycleOperation]: LifecycleHook;
};

interface Registry {
  [schemaName: string]: LifecycleHooks;
}

export class LifecycleHookManager {
  private static registry: Registry = {};

  private static models = new Map<string, ModelDefinition>();

  public static getModel(name: string) {
    return LifecycleHookManager.models.get(name);
  }

  private static addModel(model: ModelDefinition) {
    if (LifecycleHookManager.models.has(model.name)) {
      throw new Error(`Model with name ${model.name} already exists`);
    }

    LifecycleHookManager.models.set(model.name, model);
  }

  private static createLifecycleCallback<H = PreHook | PostHook>(): H {
    let currentCallback = (..._args: any[]) => {};

    async function dynamicCallback(...args: any[]) {
      await currentCallback.apply(this, args);
    }

    dynamicCallback['execute'] = function (newCallback: H) {
      if (typeof newCallback !== 'function') {
        throw new Error('Lifecycle callback must be a function');
      }
      currentCallback = newCallback as typeof currentCallback;
    };

    return dynamicCallback as H;
  }

  public static attach(model: ModelDefinition): ModelDefinition {
    LifecycleHookManager.addModel(model);
    const { name, schema } = model;
    const operations: {
      [key in LifecycleOperation]: ('pre' | 'post')[];
    } = {
      validate: ['pre', 'post'],
      save: ['pre', 'post'],
      deleteOne: ['pre', 'post'],
      deleteMany: ['pre', 'post'],
      findOneAndUpdate: ['pre', 'post'],
      //   insertMany: ['pre'],
      //   update: ['pre', 'post'],
      //   updateOne: ['pre', 'post'],
      updateMany: ['pre', 'post'],
    };

    const lifecycleHooks: LifecycleHooks = {} as LifecycleHooks;

    for (const [op, types] of Object.entries(operations)) {
      const hooks: LifecycleHook = {
        pre: this.createLifecycleCallback() as LifecycleHook['pre'],
        post: this.createLifecycleCallback() as LifecycleHook['post'],
      };

      types.forEach((type) => {
        schema[type](op, hooks[type]);
      });

      lifecycleHooks[op] = hooks;
    }

    this.registry[name] = lifecycleHooks;

    return model;
  }

  static getHooks(modelName: string): LifecycleHooks | undefined {
    return this.registry[modelName];
  }
}
