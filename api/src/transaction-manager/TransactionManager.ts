/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ClientSession } from 'mongoose';

// TODO: logging
export class TransactionManager {
  private hasCommited = false;

  private hasAborted = false;

  private hasEnded = false;

  private callbackHasErrored = false;

  constructor(private session: ClientSession) {
    this.session.startTransaction();
  }

  async withTransaction<T>(
    callback: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    try {
      const result = await callback(this.session).catch((err) => {
        this.callbackHasErrored = true;
        throw err;
      });

      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.abortTransaction();
      throw error;
    } finally {
      await this.endTransaction();
    }
  }

  private async commitTransaction() {
    if (this.session.inTransaction()) {
      await this.session.commitTransaction();
      this.hasCommited = true;
    }
  }

  private async abortTransaction() {
    if (this.session.inTransaction()) {
      await this.session.abortTransaction();
      this.hasAborted = true;
    }
  }

  private async endTransaction() {
    await this.session.endSession();
    this.hasEnded = true;
  }
}
