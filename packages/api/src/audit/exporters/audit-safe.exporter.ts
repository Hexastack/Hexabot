/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IAuditLog, IAuditLogExporter } from 'nestjs-auditlog';

import { LoggerService } from '@/logger/logger.service';

export class AuditSafeExporter implements IAuditLogExporter {
  constructor(
    private readonly delegate: IAuditLogExporter,
    private readonly failClosed: boolean,
    private readonly logger: LoggerService,
  ) {}

  async startup(): Promise<void> {
    await this.runSafely(() => this.delegate.startup());
  }

  async shutdown(): Promise<void> {
    await this.runSafely(() => this.delegate.shutdown());
  }

  async sendAuditLog(log: IAuditLog): Promise<void> {
    await this.runSafely(() => this.delegate.sendAuditLog(log));
  }

  customLoggerBodyTransformation(log: IAuditLog): string {
    return this.delegate.customLoggerBodyTransformation(log);
  }

  clone(): IAuditLogExporter {
    return new AuditSafeExporter(
      this.delegate.clone(),
      this.failClosed,
      this.logger,
    );
  }

  private async runSafely(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error) {
      if (this.failClosed) {
        throw error;
      }

      this.logger.warn('Audit log export failed', error);
    }
  }
}
