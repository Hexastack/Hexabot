/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { loggingStorage } from './logger.context';

export function LogClass() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    const prototype = constructor.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function',
    );

    for (const methodName of methodNames) {
      const originalMethod = prototype[methodName];
      const className = constructor.name;

      // Preserve all metadata
      const metadataKeys = Reflect.getMetadataKeys(originalMethod);
      const metadata = metadataKeys.reduce((acc, key) => {
        acc[key] = Reflect.getMetadata(key, originalMethod);
        return acc;
      }, {});

      prototype[methodName] = function (...args: any[]) {
        return loggingStorage.run({ className, methodName }, () => {
          const result = originalMethod.apply(this, args);
          return result instanceof Promise
            ? result.catch((e) => {
                loggingStorage.disable();
                throw e;
              })
            : result;
        });
      };

      // Restore metadata
      Object.entries(metadata).forEach(([key, value]) => {
        Reflect.defineMetadata(key, value, prototype[methodName]);
      });
    }

    return constructor;
  };
}

// Optional method decorator for explicit control
export function LogMethod() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = function (...args: any[]) {
      return loggingStorage.run({ className, methodName: propertyKey }, () =>
        originalMethod.apply(this, args),
      );
    };
  };
}
