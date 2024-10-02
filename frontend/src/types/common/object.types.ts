/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export type TFilterNestedKeysOfType<T, U = string> = T extends object
  ? {
      [K in keyof T]: T[K] extends U
        ? `${K & string}`
        : T[K] extends object
        ? Array<any> extends T[K]
          ? never
          : `${K & string}.${TFilterNestedKeysOfType<T[K], U>}`
        : never;
    }[keyof T]
  : never;
