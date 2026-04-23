/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Thread } from '@hexabot-ai/types';

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
    setTitleIfMissing: jest.Mock;
    create: jest.Mock;
    updateOne: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      findOneForSubscriber: jest.fn(),
      findLatestOpenThreadForSubscriber: jest.fn(),
      findLatestThreadForSubscriber: jest.fn(),
      setTitleIfMissing: jest.fn(),
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

  describe('resolveThreadForReadWithoutCreate', () => {
    it('uses an explicit thread when it belongs to subscriber', async () => {
      const explicit = createThread({ id: 'thread-explicit' });
      repository.findOneForSubscriber.mockResolvedValue(explicit);

      const resolved = await service.resolveThread({
        subscriberId: 'sub-1',
        explicitThreadId: explicit.id,
      });

      expect(repository.findOneForSubscriber).toHaveBeenCalledWith(
        explicit.id,
        'sub-1',
      );
      expect(resolved).toEqual(explicit);
    });

    it('throws when explicit thread does not belong to subscriber', async () => {
      repository.findOneForSubscriber.mockResolvedValue(null);

      await expect(
        service.resolveThread({
          subscriberId: 'sub-1',
          explicitThreadId: 'thread-foreign',
        }),
      ).rejects.toThrow(
        'Thread thread-foreign was not found for subscriber sub-1',
      );
    });

    it('returns null when subscriber has no thread', async () => {
      repository.findLatestOpenThreadForSubscriber.mockResolvedValue(null);
      repository.findLatestThreadForSubscriber.mockResolvedValue(null);

      const resolved = await service.resolveThread({
        subscriberId: 'sub-1',
      });

      expect(resolved).toBeNull();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('returns latest open thread when available', async () => {
      const latestOpen = createThread({ id: 'thread-open' });
      repository.findLatestOpenThreadForSubscriber.mockResolvedValue(
        latestOpen,
      );

      const resolved = await service.resolveThread({
        subscriberId: 'sub-1',
      });

      expect(resolved).toEqual(latestOpen);
      expect(repository.findLatestThreadForSubscriber).not.toHaveBeenCalled();
    });

    it('falls back to latest thread when no open thread exists', async () => {
      const latest = createThread({ id: 'thread-latest', status: 'closed' });
      repository.findLatestOpenThreadForSubscriber.mockResolvedValue(null);
      repository.findLatestThreadForSubscriber.mockResolvedValue(latest);

      const resolved = await service.resolveThread({
        subscriberId: 'sub-1',
      });

      expect(resolved).toEqual(latest);
    });
  });

  describe('resolveThreadForRead', () => {
    it('creates a thread when none exists', async () => {
      const created = createThread({ id: 'thread-created' });
      repository.findLatestOpenThreadForSubscriber.mockResolvedValue(null);
      repository.findLatestThreadForSubscriber.mockResolvedValue(null);
      repository.create.mockResolvedValue(created);

      const resolved = await service.resolveOrCreateThread({
        subscriberId: 'sub-1',
      });

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(resolved).toEqual(created);
    });
  });

  describe('buildThreadTitleFromIncomingText', () => {
    it('returns null when text is empty', () => {
      expect(service.buildThreadTitleFromIncomingText('   ')).toBeNull();
    });

    it('normalizes whitespace', () => {
      expect(
        service.buildThreadTitleFromIncomingText(
          'Hello   world\nfrom\tHexabot',
        ),
      ).toBe('Hello world from Hexabot');
    });

    it('truncates long messages and adds ellipsis', () => {
      const max = ThreadService.THREAD_TITLE_MAX_LENGTH;
      const source = 'x'.repeat(max + 20);
      const title = service.buildThreadTitleFromIncomingText(source);

      expect(title).toBe(`${'x'.repeat(max - 3)}...`);
      expect(title).toHaveLength(max);
    });
  });

  describe('setThreadTitleIfMissing', () => {
    it('delegates to repository conditional title setter', async () => {
      repository.setTitleIfMissing.mockResolvedValue(
        createThread({
          id: 'thread-title',
          title: 'Need help with billing...',
        }),
      );

      const updated = await service.setThreadTitleIfMissing(
        'thread-title',
        'Need help with billing...',
      );

      expect(repository.setTitleIfMissing).toHaveBeenCalledWith(
        'thread-title',
        'Need help with billing...',
      );
      expect(updated?.title).toBe('Need help with billing...');
    });
  });
});
