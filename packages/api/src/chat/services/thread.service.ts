/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Thread } from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { ThreadOrmEntity } from '../entities/thread.entity';
import { ThreadRepository } from '../repositories/thread.repository';

@Injectable()
export class ThreadService extends BaseOrmService<ThreadOrmEntity> {
  public static readonly THREAD_TITLE_MAX_LENGTH = 96;

  public static readonly THREAD_TITLE_ELLIPSIS = '...';

  constructor(readonly repository: ThreadRepository) {
    super(repository);
  }

  getDefaultInactivityHours(): number {
    return 24;
  }

  getInactivityThresholdMs(hours?: number): number {
    const normalizedHours = Number.isFinite(hours)
      ? Math.max(0, Number(hours))
      : this.getDefaultInactivityHours();

    return normalizedHours * 60 * 60 * 1000;
  }

  async findThreadForSubscriber(
    threadId: string,
    subscriberId: string,
  ): Promise<Thread | null> {
    return await this.repository.findOneForSubscriber(threadId, subscriberId);
  }

  async createThread(subscriberId: string, title?: string | null) {
    return await this.create({
      subscriber: subscriberId,
      title: title ?? null,
      status: 'open',
      lastMessageAt: new Date(),
      closeReason: null,
      closedAt: null,
    });
  }

  buildThreadTitleFromIncomingText(input?: string | null): string | null {
    if (typeof input !== 'string') {
      return null;
    }

    const normalized = input.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return null;
    }

    if (normalized.length <= ThreadService.THREAD_TITLE_MAX_LENGTH) {
      return normalized;
    }

    const trimmedMax = Math.max(
      1,
      ThreadService.THREAD_TITLE_MAX_LENGTH -
        ThreadService.THREAD_TITLE_ELLIPSIS.length,
    );

    return `${normalized.slice(0, trimmedMax).trimEnd()}${ThreadService.THREAD_TITLE_ELLIPSIS}`;
  }

  async setThreadTitleIfMissing(threadId: string, title: string) {
    return await this.repository.setTitleIfMissing(threadId, title);
  }

  async touchThread(threadId: string, at: Date = new Date()) {
    return await this.updateOne(threadId, {
      lastMessageAt: at,
    });
  }

  async closeThread(
    threadId: string,
    reason: 'manual' | 'inactivity' = 'manual',
    at: Date = new Date(),
  ) {
    return await this.updateOne(threadId, {
      status: 'closed',
      closeReason: reason,
      closedAt: at,
      lastMessageAt: at,
    });
  }

  async reopenThread(threadId: string, at: Date = new Date()) {
    return await this.updateOne(threadId, {
      status: 'open',
      closeReason: null,
      closedAt: null,
      lastMessageAt: at,
    });
  }

  async resolveThreadForIncoming({
    subscriberId,
    explicitThreadId,
    inactivityHours,
  }: {
    subscriberId: string;
    explicitThreadId?: string;
    inactivityHours?: number;
  }): Promise<Thread> {
    const now = new Date();

    if (explicitThreadId) {
      const explicit = await this.repository.findOne({
        where: {
          id: explicitThreadId,
          subscriber: { id: subscriberId },
        },
      });
      if (!explicit) {
        throw new Error(
          `Thread ${explicitThreadId} was not found for subscriber ${subscriberId}`,
        );
      }

      if (explicit.status === 'closed') {
        return await this.reopenThread(explicit.id, now);
      }

      await this.touchThread(explicit.id, now);

      return explicit;
    }

    const latestOpen =
      await this.repository.findLatestOpenThreadForSubscriber(subscriberId);

    if (!latestOpen) {
      return await this.createThread(subscriberId);
    }

    const anchor = latestOpen.lastMessageAt ?? latestOpen.createdAt;
    const inactivityMs = this.getInactivityThresholdMs(inactivityHours);
    const hasExpired = now.getTime() - anchor.getTime() > inactivityMs;

    if (hasExpired) {
      await this.closeThread(latestOpen.id, 'inactivity', now);

      return await this.createThread(subscriberId);
    }

    await this.touchThread(latestOpen.id, now);

    return latestOpen;
  }

  async resolveOrCreateThread({
    subscriberId,
    explicitThreadId,
  }: {
    subscriberId: string;
    explicitThreadId?: string;
  }): Promise<Thread> {
    const resolved = await this.resolveThread({
      subscriberId,
      explicitThreadId,
    });
    if (resolved) {
      return resolved;
    }

    return await this.createThread(subscriberId);
  }

  async resolveThread({
    subscriberId,
    explicitThreadId,
  }: {
    subscriberId: string;
    explicitThreadId?: string;
  }): Promise<Thread | null> {
    if (explicitThreadId) {
      const explicit = await this.findThreadForSubscriber(
        explicitThreadId,
        subscriberId,
      );
      if (!explicit) {
        throw new Error(
          `Thread ${explicitThreadId} was not found for subscriber ${subscriberId}`,
        );
      }

      return explicit;
    }

    const latestOpen =
      await this.repository.findLatestOpenThreadForSubscriber(subscriberId);

    if (latestOpen) {
      return latestOpen;
    }

    const latest =
      await this.repository.findLatestThreadForSubscriber(subscriberId);

    return latest ?? null;
  }

  /**
   * Resolve inactivity timeout from channel settings object.
   */
  resolveInactivityHours(settings: unknown): number {
    const candidate = (settings as { thread_inactivity_hours?: unknown })
      ?.thread_inactivity_hours;

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.max(0, candidate);
    }
    if (typeof candidate === 'string') {
      const parsed = Number.parseInt(candidate, 10);
      if (!Number.isNaN(parsed)) {
        return Math.max(0, parsed);
      }
    }

    return this.getDefaultInactivityHours();
  }
}
