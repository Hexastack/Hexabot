/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ClsService } from 'nestjs-cls';

import { AuditClsStore } from '../types/audit-context.type';

import { AuditContextService } from './audit-context.service';

describe('AuditContextService', () => {
  let store: AuditClsStore;
  let cls: jest.Mocked<
    Pick<ClsService<AuditClsStore>, 'isActive' | 'get' | 'set'>
  >;
  let service: AuditContextService;

  beforeEach(() => {
    store = {};
    cls = {
      isActive: jest.fn().mockReturnValue(true),
      get: jest.fn((key?: keyof AuditClsStore) =>
        key ? store[key] : store,
      ) as any,
      set: jest.fn((key: keyof AuditClsStore, value: any) => {
        store[key] = value;
      }) as any,
    };
    service = new AuditContextService(
      cls as unknown as ClsService<AuditClsStore>,
    );
  });

  it('merges context into the active CLS store', () => {
    service.setContext({ requestId: 'request-1', method: 'GET' });
    service.setContext({ actorId: 'user-1' });

    expect(service.getContext()).toEqual({
      requestId: 'request-1',
      method: 'GET',
      actorId: 'user-1',
    });
  });

  it('does not write when no CLS context is active', () => {
    cls.isActive.mockReturnValue(false);

    service.setContext({ requestId: 'request-1' });

    expect(cls.set).not.toHaveBeenCalled();
    expect(service.getContext()).toEqual({});
  });

  it('captures request actor and metadata', () => {
    service.setFromRequest({
      headers: {
        'x-request-id': 'request-1',
        'x-forwarded-for': '203.0.113.1, 10.0.0.1',
        'user-agent': 'browser',
      },
      ip: '127.0.0.1',
      method: 'PATCH',
      originalUrl: '/api/user/1',
      socket: {},
      user: {
        id: 'user-1',
        roles: ['admin'],
      },
      session: {
        passport: {
          user: {
            id: 'session-user',
          },
        },
      },
    } as any);

    expect(service.getContext()).toEqual({
      requestId: 'request-1',
      actorId: 'user-1',
      actorType: 'admin',
      ip: '203.0.113.1',
      userAgent: 'browser',
      method: 'PATCH',
      path: '/api/user/1',
    });
  });
});
