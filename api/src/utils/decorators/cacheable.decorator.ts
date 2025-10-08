/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Cache } from 'cache-manager';

export function Cacheable(cacheKey: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache: Cache | undefined = this.cacheManager;

      if (!cache) {
        throw new Error(
          'Cannot use Cacheable() decorator without injecting the cache manager.',
        );
      }

      // Try to get cached data
      try {
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Cache get error for key: ${cacheKey}:`, error);
      }

      // Call the original method if cache miss
      const result = await originalMethod.apply(this, args);

      // Set the new result in cache
      try {
        await cache.set(cacheKey, result);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Cache set error for key: ${cacheKey}:`, error);
      }

      return result;
    };

    return descriptor;
  };
}
