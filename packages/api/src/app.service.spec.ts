/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException } from '@nestjs/common';

import { AppService } from './app.service';
import { I18nService } from './i18n/services/i18n.service';
import { PermissionService } from './user/services/permission.service';
import { UserService } from './user/services/user.service';
import { Action } from './user/types/action.type';
import { WebsocketGateway } from './websocket';

describe('AppService', () => {
  const i18nServiceMock = {
    t: jest.fn(),
  } as unknown as I18nService;
  const userServiceMock = {
    findOne: jest.fn(),
  } as unknown as UserService;
  const permissionServiceMock = {
    getPermissions: jest.fn(),
  } as unknown as PermissionService;
  const emit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit });
  const websocketGatewayMock = {
    io: { to },
  } as unknown as WebsocketGateway;

  let appService: AppService;

  beforeEach(() => {
    jest.clearAllMocks();
    (i18nServiceMock.t as jest.Mock).mockReturnValue('Welcome');

    appService = new AppService(
      i18nServiceMock,
      userServiceMock,
      permissionServiceMock,
      websocketGatewayMock,
    );
  });

  describe('getHello', () => {
    it('delegates translation to i18n service', () => {
      expect(appService.getHello()).toBe('Welcome');
      expect(i18nServiceMock.t).toHaveBeenCalledWith('welcome', { lang: 'en' });
    });
  });

  describe('subscribe', () => {
    it('subscribes the socket to all readable model rooms', async () => {
      (userServiceMock.findOne as jest.Mock).mockResolvedValue({
        id: 'user-id',
        roles: ['admin', 'editor'],
      });
      (permissionServiceMock.getPermissions as jest.Mock).mockResolvedValue({
        admin: {
          workflow: [Action.READ, Action.UPDATE],
          user: [Action.UPDATE],
        },
        editor: {
          translation: [Action.READ],
          workflow: [Action.READ],
        },
      });

      const join = jest.fn().mockResolvedValue(undefined);
      const req = {
        session: {
          passport: {
            user: {
              id: 'user-id',
            },
          },
        },
        socket: {
          join,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => payload),
      };
      const result = await appService.subscribe(req as any, res as any);

      expect(userServiceMock.findOne).toHaveBeenCalledWith('user-id');
      expect(permissionServiceMock.getPermissions).toHaveBeenCalled();
      expect(join).toHaveBeenCalledTimes(2);
      expect(join).toHaveBeenNthCalledWith(1, 'workflow');
      expect(join).toHaveBeenNthCalledWith(2, 'translation');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        subscribe: ['workflow', 'translation'],
      });
      expect(result).toEqual({
        success: true,
        subscribe: ['workflow', 'translation'],
      });
    });

    it('throws when no authenticated user is available on the socket session', async () => {
      const req = {
        session: {},
      };
      const res = {};

      await expect(
        appService.subscribe(req as any, res as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws when user from session cannot be found', async () => {
      (userServiceMock.findOne as jest.Mock).mockResolvedValue(null);

      const req = {
        session: {
          passport: {
            user: {
              id: 'missing-user',
            },
          },
        },
      };
      const res = {};

      await expect(
        appService.subscribe(req as any, res as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('entity lifecycle hooks', () => {
    it('broadcasts create events to the derived entity room', () => {
      appService.handleEntityCreated({
        metadata: { name: 'WorkflowOrmEntity' },
        entity: { id: 'workflow-id' },
      });

      expect(to).toHaveBeenCalledWith('workflow');
      expect(emit).toHaveBeenCalledWith('entity', {
        entity: 'workflow',
        op: 'create',
        data: { id: 'workflow-id' },
      });
    });

    it('broadcasts update events using databaseEntity when entity is missing', () => {
      appService.handleEntityUpdated({
        metadata: { name: 'SubscriberOrmEntity' },
        databaseEntity: { id: 'subscriber-id' },
      });

      expect(to).toHaveBeenCalledWith('subscriber');
      expect(emit).toHaveBeenCalledWith('entity', {
        entity: 'subscriber',
        op: 'update',
        data: { id: 'subscriber-id' },
      });
    });

    it('broadcasts delete events with entity id fallback', () => {
      appService.handleEntityDeleted({
        metadata: { name: 'MessageOrmEntity' },
        entityId: 'message-id',
      });

      expect(to).toHaveBeenCalledWith('message');
      expect(emit).toHaveBeenCalledWith('entity', {
        entity: 'message',
        op: 'delete',
        data: { id: 'message-id' },
      });
    });

    it('ignores events with missing metadata', () => {
      appService.handleEntityCreated({
        entity: { id: 'ignored' },
      } as any);

      expect(to).not.toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });
  });
});
