/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
