/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { INestApplication } from '@nestjs/common';

export class AppInstance {
  private static app: INestApplication | null = null;

  static setApp(app: INestApplication) {
    this.app = app;
  }

  static getApp(): INestApplication {
    if (!this.app) {
      throw new Error('App instance has not been set yet.');
    }
    return this.app;
  }

  /**
   * Checks whether the application context is initialized.
   * This may return `false` in environments where the app instance is not set,
   * such as when running in test env or CLI mode without a full application bootstrap.
   */
  static isReady(): boolean {
    return this.app !== null;
  }
}
