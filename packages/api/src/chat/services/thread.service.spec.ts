/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Thread } from '@/chat/dto/thread.dto';
import { ThreadRepository } from '@/chat/repositories/thread.repository';

import { ThreadService } from './thread.service';

const createThread = (overrides: Partial<Thread> = {}): Thread => ({
  id: 'thread-1',
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  subscriber: 'sub-1',
  status: 'open',
  lastMessageAt: new Date('2026-03-01T00:00:00.000Z'),
  closedAt: null,
  closeReason: null,
  title: null,
  ...overrides,
});

describe('ThreadService', () => {
  let service: ThreadService;
  let repository: {
    findOne: jest.Mock;
    findOneForSubscriber: jest.Mock;
    findLatestOpenThreadForSubscriber: jest.Mock;
    findLatestThreadForSubscriber: jest.Mock;
    create: jest.Mock;
    updateOne: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      findOneForSubscriber: jest.fn(),
      findLatestOpenThreadForSubscriber: jest.fn(),
      findLatestThreadForSubscriber: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
    };

    service = new ThreadService(repository as unknown as ThreadRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('resolveThreadForIncoming', () => {
    it('uses an explicit open thread and refreshes last activity', async () => {
      const now = new Date('2026-03-01T10:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      const explicit = createThread({
        id: 'thread-explicit',
        lastMessageAt: new Date('2026-03-01T08:00:00.000Z'),
      });
      repository.findOne.mockResolvedValue(explicit);
      repository.updateOne.mockResolvedValue({
        ...explicit,
        lastMessageAt: now,
      });

      const resolved = await service.resolveThreadForIncoming({
        subscriberId: 'sub-1',
        explicitThreadId: explicit.id,
      });

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: explicit.id,
          subscriber: { id: 'sub-1' },
        },
      });
      expect(repository.updateOne).toHaveBeenCalledWith(
        explicit.id,
        { lastMessageAt: now },
        undefined,
      );
      expect(resolved).toEqual(explicit);
    });

    it('reopens explicit closed thread', async () => {
      const now = new Date('2026-03-01T10:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      const explicitClosed = createThread({
        id: 'thread-closed',
        status: 'closed',
        closeReason: 'manual',
        closedAt: new Date('2026-03-01T06:00:00.000Z'),
      });
      const reopened = createThread({
        ...explicitClosed,
        status: 'open',
        closeReason: null,
        closedAt: null,
        lastMessageAt: now,
      });
      repository.findOne.mockResolvedValue(explicitClosed);
      repository.updateOne.mockResolvedValue(reopened);

      const resolved = await service.resolveThreadForIncoming({
        subscriberId: 'sub-1',
        explicitThreadId: explicitClosed.id,
      });

      expect(repository.updateOne).toHaveBeenCalledWith(
        explicitClosed.id,
        {
          status: 'open',
          closeReason: null,
          closedAt: null,
          lastMessageAt: now,
        },
        undefined,
      );
      expect(resolved).toEqual(reopened);
    });

    it('rejects explicit thread that does not belong to subscriber', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.resolveThreadForIncoming({
          subscriberId: 'sub-1',
          explicitThreadId: 'thread-foreign',
        }),
      ).rejects.toThrow(
        'Thread thread-foreign was not found for subscriber sub-1',
      );
      expect(repository.updateOne).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('creates a new thread when there is no existing open thread', async () => {
      const now = new Date('2026-03-01T10:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      const created = createThread({
        id: 'thread-new',
        lastMessageAt: now,
      });
      repository.findLatestOpenThreadForSubscriber.mockResolvedValue(null);
      repository.create.mockResolvedValue(created);

      const resolved = await service.resolveThreadForIncoming({
        subscriberId: 'sub-1',
      });

      expect(repository.create).toHaveBeenCalledWith({
        subscriber: 'sub-1',
        title: null,
        status: 'open',
        lastMessageAt: now,
        closeReason: null,
        closedAt: null,
      });
      expect(resolved).toEqual(created);
    });

    it('rolls over inactive open thread by closing and creating a new one', async () => {
      const now = new Date('2026-03-02T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      const stale = createThread({
        id: 'thread-stale',
        lastMessageAt: new Date('2026-02-28T11:00:00.000Z'),
      });
      const fresh = createThread({
        id: 'thread-fresh',
        lastMessageAt: now,
      });
      repository.findLatestOpenThreadForSubscriber.mockResolvedValue(stale);
      repository.updateOne.mockResolvedValue({
        ...stale,
        status: 'closed',
        closeReason: 'inactivity',
        closedAt: now,
        lastMessageAt: now,
      });
      repository.create.mockResolvedValue(fresh);

      const resolved = await service.resolveThreadForIncoming({
        subscriberId: 'sub-1',
        inactivityHours: 24,
      });

      expect(repository.updateOne).toHaveBeenCalledWith(
        stale.id,
        {
          status: 'closed',
          closeReason: 'inactivity',
          closedAt: now,
          lastMessageAt: now,
        },
        undefined,
      );
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(resolved).toEqual(fresh);
    });
  });
});
