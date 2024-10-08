/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export class SocketEventMetadataStorage {
  private static metadata = new Map<string, any>();

  static addEventMetadata(
    target: any,
    propertyKey: string | symbol,
    metadata: any,
  ) {
    const key = target.constructor.name;
    if (!this.metadata.has(key)) {
      this.metadata.set(key, []);
    }
    this.metadata.get(key).push({ propertyKey, ...metadata });
  }

  static getMetadataFor(target: any): any[] {
    return this.metadata.get(target.constructor.name) || [];
  }
}
