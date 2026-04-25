/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  IntegrationHealthItem,
  IntegrationHealthResponse,
  IntegrationHealthStatus,
  Source,
} from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';

import { ChannelService } from '@/channel/channel.service';
import type ChannelHandler from '@/channel/lib/Handler';
import { SourceService } from '@/channel/services/source.service';
import { ChannelHealthProvider } from '@/channel/types';
import { config } from '@/config';
import { CONSOLE_CHANNEL_NAME } from '@/extensions/channels/console/settings.schema';
import { MailerService } from '@/mailer';

const SMTP_HEALTH_TIMEOUT_MS = 3000;
const SMTP_HEALTH_TIMEOUT_MESSAGE = 'SMTP transporter verification timed out.';

@Injectable()
export class HealthService {
  constructor(
    private readonly channelService: ChannelService,
    private readonly sourceService: SourceService,
    private readonly mailerService: MailerService,
  ) {}

  private formatIntegrationName(name: string): string {
    return name
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatSourceCount(count: number, label: string): string {
    return `${count} ${label}${count === 1 ? '' : 's'}`;
  }

  private buildDefaultChannelHealth(
    handler: ChannelHandler,
    sources: Source[],
    checkedAt: string,
  ): IntegrationHealthItem {
    const channelName = handler.getName();
    const channelSources = sources.filter(
      (source) => source.channel === channelName,
    );
    const activeSources = channelSources.filter(
      (source) => source.state,
    ).length;
    const inactiveSources = channelSources.length - activeSources;
    let status: IntegrationHealthStatus;
    let reason: string;
    let message: string;

    if (activeSources > 0) {
      status = 'healthy';
      reason = 'channel.active_sources';
      message = `${this.formatSourceCount(activeSources, 'active source')} configured.`;
    } else if (channelSources.length > 0) {
      status = 'disabled';
      reason = 'channel.disabled_sources';
      message = `${this.formatSourceCount(inactiveSources, 'inactive source')} configured.`;
    } else {
      status = 'warning';
      reason = 'channel.missing_source';
      message = 'No source is configured for this channel.';
    }

    return {
      id: `channel:${channelName}`,
      kind: 'channel',
      name: this.formatIntegrationName(channelName),
      status,
      checkedAt,
      reason,
      message,
      details: {
        activeSources,
        inactiveSources,
        totalSources: channelSources.length,
      },
    };
  }

  private isChannelHealthProvider(
    handler: ChannelHandler,
  ): handler is ChannelHandler & ChannelHealthProvider {
    return (
      typeof (handler as Partial<ChannelHealthProvider>)
        .getIntegrationHealth === 'function'
    );
  }

  private async getChannelHealth(
    handler: ChannelHandler,
    sources: Source[],
    checkedAt: string,
  ): Promise<IntegrationHealthItem> {
    const defaultHealth = this.buildDefaultChannelHealth(
      handler,
      sources,
      checkedAt,
    );

    if (!this.isChannelHealthProvider(handler)) {
      return defaultHealth;
    }

    try {
      const override = await handler.getIntegrationHealth({
        checkedAt,
        sources: sources.filter(
          (source) => source.channel === handler.getName(),
        ),
        defaultHealth,
      });
      const healthOverride = override ?? {};

      return {
        ...defaultHealth,
        ...healthOverride,
        id: defaultHealth.id,
        kind: defaultHealth.kind,
        checkedAt: healthOverride.checkedAt ?? defaultHealth.checkedAt,
        status: healthOverride.status ?? defaultHealth.status,
      };
    } catch {
      return {
        ...defaultHealth,
        status: 'unhealthy',
        reason: 'channel.health_check_failed',
        message: 'Channel health check failed.',
      };
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  private async getSmtpHealth(
    checkedAt: string,
  ): Promise<IntegrationHealthItem> {
    const baseHealth = {
      id: 'service:smtp',
      kind: 'service' as const,
      name: 'Email (SMTP)',
      checkedAt,
      details: {
        enabled: config.emails.isEnabled,
      },
    };

    if (!config.emails.isEnabled) {
      return {
        ...baseHealth,
        status: 'disabled',
        reason: 'smtp.disabled',
        message: 'SMTP email delivery is disabled.',
      };
    }

    try {
      const verified = await this.withTimeout(
        this.mailerService.verifyAllTransporters(),
        SMTP_HEALTH_TIMEOUT_MS,
        SMTP_HEALTH_TIMEOUT_MESSAGE,
      );

      return verified
        ? {
            ...baseHealth,
            status: 'healthy',
            reason: 'smtp.verified',
            message: 'SMTP transporter verified successfully.',
          }
        : {
            ...baseHealth,
            status: 'unhealthy',
            reason: 'smtp.verify_failed',
            message: 'SMTP transporter verification failed.',
          };
    } catch (error) {
      const timedOut =
        error instanceof Error && error.message === SMTP_HEALTH_TIMEOUT_MESSAGE;

      return {
        ...baseHealth,
        status: 'unhealthy',
        reason: timedOut ? 'smtp.timeout' : 'smtp.verify_failed',
        message: timedOut
          ? SMTP_HEALTH_TIMEOUT_MESSAGE
          : 'SMTP transporter verification failed.',
      };
    }
  }

  async getIntegrationHealth(): Promise<IntegrationHealthResponse> {
    const checkedAt = new Date().toISOString();
    const sources = await this.sourceService.findAll();
    const channelHealth = await Promise.all(
      this.channelService
        .getAll()
        .filter((handler) => handler.getName() !== CONSOLE_CHANNEL_NAME)
        .map((handler) => this.getChannelHealth(handler, sources, checkedAt)),
    );
    const smtpHealth = await this.getSmtpHealth(checkedAt);

    return {
      checkedAt,
      integrations: [...channelHealth, smtpHealth],
    };
  }
}
