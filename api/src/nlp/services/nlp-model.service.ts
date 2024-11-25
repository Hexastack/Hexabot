/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager'; // Import CACHE_MANAGER token
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { NlpModel } from '../schemas/nlp-model.schema';

@Injectable()
export class NlpModelService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache, // Inject using CACHE_MANAGER token
  ) {}

  private readonly CACHE_PREFIX = 'nlp_model';

  /**
   * Create or update an NLP model in the cache.
   * @param model - The NLP model object to cache.
   */
  async saveModel(model: NlpModel): Promise<void> {
    const key = `${this.CACHE_PREFIX}:${model.name}`;
    // Use ttl as a number directly, instead of an object
    const ttl = model.isActive ? 3600 : 600;
    await this.cacheManager.set(key, model, ttl);
  }

  /**
   * Retrieve an NLP model from the cache by name.
   * @param name - The name of the model to retrieve.
   * @returns The cached NLP model or null if not found.
   */
  async getModel(name: string): Promise<NlpModel | null> {
    const key = `${this.CACHE_PREFIX}:${name}`;
    return await this.cacheManager.get<NlpModel>(key);
  }

  /**
   * Delete an NLP model from the cache by name.
   * @param name - The name of the model to delete.
   */
  async deleteModel(name: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}:${name}`;
    await this.cacheManager.del(key);
  }

  /**
   * Retrieve all active NLP models from the cache.
   * @param models - The array of all NLP models.
   * @returns An array of active models.
   */
  getActiveModels(models: NlpModel[] = []): NlpModel[] {
    return models.filter((model) => model.isActive);
  }

  /**
   * Converts an array of NLP models into a map object.
   * @param models - Array of NLP models.
   * @returns A map where the key is the model's name and the value is the model.
   */
  getModelMap(models: NlpModel[] = []): Record<string, NlpModel> {
    return models.reduce(
      (acc, curr) => {
        acc[curr.name] = curr;
        return acc;
      },
      {} as Record<string, NlpModel>,
    );
  }
}
