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

type SubscriptionRequest = {
  session: {
    passport?: {
      user?: {
        id?: string;
      };
    };
  };
  socket: {
    join: jest.Mock<Promise<void>, [string]>;
  };
};

type SubscriptionResponse = {
  status: jest.Mock<SubscriptionResponse, [number]>;
  json: jest.Mock<unknown, [unknown]>;
};

describe('AppService', () => {
  const i18nServiceMock: Pick<I18nService, 't'> = {
    t: jest.fn(),
  };
  const userServiceMock: Pick<UserService, 'findOne'> = {
    findOne: jest.fn(),
  };
  const permissionServiceMock: Pick<PermissionService, 'getPermissions'> = {
    getPermissions: jest.fn(),
  };

  let emit: jest.Mock;
  let to: jest.Mock;
  let websocketGatewayMock: {
    io: {
      to: jest.Mock;
    };
  };
  let appService: AppService;

  const buildReq = ({
    userId,
    join = jest.fn().mockResolvedValue(undefined),
  }: {
    userId?: string;
    join?: jest.Mock<Promise<void>, [string]>;
  } = {}): SubscriptionRequest => ({
    session: userId
      ? {
          passport: {
            user: {
              id: userId,
            },
          },
        }
      : {},
    socket: {
      join,
    },
  });
  const buildRes = (): SubscriptionResponse => {
    const res: SubscriptionResponse = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockImplementation((payload) => payload);

    return res;
  };
  const buildEntity = (payload: Record<string, unknown>) => {
    const entity: Record<string, unknown> & { toPlainCls: jest.Mock } = {
      ...payload,
      toPlainCls: jest.fn(),
    };

    entity.toPlainCls.mockImplementation(() => {
      const { toPlainCls: _toPlainCls, ...plain } = entity;

      return plain;
    });

    return entity;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (i18nServiceMock.t as jest.Mock).mockReturnValue('Welcome');

    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });
    websocketGatewayMock = {
      io: { to },
    };

    appService = new AppService(
      i18nServiceMock as unknown as I18nService,
      userServiceMock as unknown as UserService,
      permissionServiceMock as unknown as PermissionService,
      websocketGatewayMock as unknown as WebsocketGateway,
    );
  });

  describe('getHello', () => {
    it('delegates translation to i18n service', () => {
      expect(appService.getHello()).toBe('Welcome');
      expect(i18nServiceMock.t).toHaveBeenCalledWith('welcome', { lang: 'en' });
    });
  });

  describe('subscribeToEntityRooms', () => {
    it('subscribes the socket once per readable room and normalizes room names', async () => {
      (userServiceMock.findOne as jest.Mock).mockResolvedValue({
        id: 'user-id',
        roles: ['admin', 'editor', 'ghost'],
      });
      (permissionServiceMock.getPermissions as jest.Mock).mockResolvedValue({
        admin: {
          Workflow: [Action.READ, Action.UPDATE],
          user: [Action.UPDATE],
        },
        editor: {
          TRANSLATION: [Action.READ],
          workflow: [Action.READ],
        },
      });

      const join = jest.fn().mockResolvedValue(undefined);
      const req = buildReq({ userId: 'user-id', join });
      const res = buildRes();
      const result = await appService.subscribeToEntityRooms(
        req as any,
        res as any,
      );

      expect(userServiceMock.findOne).toHaveBeenCalledWith('user-id');
      expect(permissionServiceMock.getPermissions).toHaveBeenCalledTimes(1);
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

    it('returns an empty subscription list when user has no readable permissions', async () => {
      (userServiceMock.findOne as jest.Mock).mockResolvedValue({
        id: 'viewer-user',
        roles: ['viewer'],
      });
      (permissionServiceMock.getPermissions as jest.Mock).mockResolvedValue({
        viewer: {
          workflow: [Action.UPDATE],
        },
      });

      const join = jest.fn().mockResolvedValue(undefined);
      const req = buildReq({ userId: 'viewer-user', join });
      const res = buildRes();
      const result = await appService.subscribeToEntityRooms(
        req as any,
        res as any,
      );

      expect(join).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(result).toEqual({
        success: true,
        subscribe: [],
      });
    });

    it('ignores role ids that are missing from the permission tree', async () => {
      (userServiceMock.findOne as jest.Mock).mockResolvedValue({
        id: 'ghost-user',
        roles: ['ghost'],
      });
      (permissionServiceMock.getPermissions as jest.Mock).mockResolvedValue({
        admin: {
          workflow: [Action.READ],
        },
      });

      const req = buildReq({ userId: 'ghost-user' });
      const res = buildRes();
      const result = await appService.subscribeToEntityRooms(
        req as any,
        res as any,
      );

      expect(result).toEqual({
        success: true,
        subscribe: [],
      });
      expect(req.socket.join).not.toHaveBeenCalled();
    });

    it('throws when no authenticated user is available on the socket session', async () => {
      const req = buildReq();
      const res = buildRes();
      const result = appService.subscribeToEntityRooms(req as any, res as any);

      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
      await expect(result).rejects.toThrow(
        'Only authenticated users are allowed to join entity rooms!',
      );

      expect(userServiceMock.findOne).not.toHaveBeenCalled();
      expect(permissionServiceMock.getPermissions).not.toHaveBeenCalled();
    });

    it('throws when user from session cannot be found', async () => {
      (userServiceMock.findOne as jest.Mock).mockResolvedValue(null);

      const req = buildReq({ userId: 'missing-user' });
      const res = buildRes();
      const result = appService.subscribeToEntityRooms(req as any, res as any);

      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
      await expect(result).rejects.toThrow(
        'You are not authorized to subscribe!',
      );

      expect(permissionServiceMock.getPermissions).not.toHaveBeenCalled();
    });
  });

  describe('entity lifecycle hooks', () => {
    it('broadcasts create events to the derived entity room', () => {
      const entity = buildEntity({ id: 'workflow-id' });

      appService.handleEntityCreated({
        metadata: { name: 'WorkflowOrmEntity' },
        entity,
      } as any);

      expect(to).toHaveBeenCalledWith('workflow');
      expect(emit).toHaveBeenCalledWith('entity', {
        entity: 'workflow',
        op: 'create',
        data: { id: 'workflow-id' },
      });
    });

    it('broadcasts update events using entity', () => {
      const entity = buildEntity({
        id: 'subscriber-id',
        firstName: 'Jhon',
        lastName: 'Doe',
      });

      appService.handleEntityUpdated({
        metadata: { name: 'SubscriberOrmEntity' },
        entity,
      } as any);

      expect(to).toHaveBeenCalledWith('subscriber');
      expect(emit).toHaveBeenCalledWith('entity', {
        entity: 'subscriber',
        op: 'update',
        data: { id: 'subscriber-id', firstName: 'Jhon', lastName: 'Doe' },
      });
    });

    it('broadcasts delete events using repository-normalized entity data', () => {
      const entity = buildEntity({
        id: 'message-id',
        message: { text: 'Hello' },
      });

      appService.handleEntityDeleted({
        metadata: { name: 'MessageOrmEntity' },
        entity,
      } as any);

      expect(to).toHaveBeenCalledWith('message');
      expect(emit).toHaveBeenCalledWith('entity', {
        entity: 'message',
        op: 'delete',
        data: { id: 'message-id', message: { text: 'Hello' } },
      });
    });

    it('supports metadata names without the OrmEntity suffix', () => {
      const entity = buildEntity({ id: 'user-id' });

      appService.handleEntityCreated({
        metadata: { name: 'User' },
        entity,
      } as any);

      expect(to).toHaveBeenCalledWith('user');
      expect(emit).toHaveBeenCalledWith('entity', {
        entity: 'user',
        op: 'create',
        data: { id: 'user-id' },
      });
    });

    it('ignores events with missing metadata', () => {
      appService.handleEntityCreated({
        entity: { id: 'ignored' },
      } as any);

      expect(to).not.toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });

    it('throws when event entity is missing', () => {
      expect(() =>
        appService.handleEntityUpdated({
          metadata: { name: 'WorkflowOrmEntity' },
        } as any),
      ).toThrow('Unable to extract entity event data');
      expect(to).not.toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });
  });
});
