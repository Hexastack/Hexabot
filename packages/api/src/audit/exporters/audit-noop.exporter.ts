/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IAuditLog, IAuditLogExporter } from 'nestjs-auditlog';

export class AuditNoopExporter implements IAuditLogExporter {
  async startup(): Promise<void> {
    return;
  }

  async shutdown(): Promise<void> {
    return;
  }

  async sendAuditLog(_log: IAuditLog): Promise<void> {
    return;
  }

  customLoggerBodyTransformation(log: IAuditLog): string {
    return JSON.stringify(log);
  }

  clone(): IAuditLogExporter {
    return this;
  }
}
