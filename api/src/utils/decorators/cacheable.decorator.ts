/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
