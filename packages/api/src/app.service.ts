/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { BaseOrmEntity } from './database';
import { I18nService } from './i18n/services/i18n.service';
import { PermissionService } from './user/services/permission.service';
import { UserService } from './user/services/user.service';
import { Action } from './user/types/action.type';
import { EHook, GenericPostHookEvent } from './utils';
import {
  SocketGet,
  SocketPost,
  SocketReq,
  SocketRequest,
  SocketRes,
  SocketResponse,
  WebsocketGateway,
} from './websocket';

type EntityMutationOperation = 'create' | 'update' | 'delete';

@Injectable()
export class AppService {
  constructor(
    private readonly i18n: I18nService,
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
    private readonly gateway: WebsocketGateway,
  ) {}

  getHello(): string {
    return this.i18n.t('welcome', { lang: 'en' });
  }

  @SocketGet('/entity/subscribe/')
  @SocketPost('/entity/subscribe/')
  async subscribeToEntityRooms(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ) {
    const userId = req.session.passport?.user?.id;

    if (!userId) {
      throw new ForbiddenException(
        'Only authenticated users are allowed to join entity rooms!',
      );
    }

    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new ForbiddenException('You are not authorized to subscribe!');
    }

    const roleIds = user.roles ?? [];
    const permissions = await this.permissionService.getPermissions();
    const subscribe = Array.from(
      new Set(
        roleIds.flatMap((roleId) =>
          Object.entries(permissions[roleId] || {})
            .filter(([, actions]) => actions.includes(Action.READ))
            .map(([model]) => model.toLowerCase()),
        ),
      ),
    );

    await Promise.all(subscribe.map((room) => req.socket.join(room)));

    return res.status(200).json({
      success: true,
      subscribe,
    });
  }

  private postActionToOp(action: EHook) {
    return action.replace('post', '').toLowerCase();
  }

  @OnEvent('hook:*:postCreate')
  @OnEvent('hook:*:postUpdate')
  @OnEvent('hook:*:postDelete')
  handleEntityPostEvents(
    event: GenericPostHookEvent<
      BaseOrmEntity,
      EHook.postCreate | EHook.postUpdate | EHook.postDelete
    >,
  ) {
    this.broadcastEntityMutationEvent(event);
  }

  private broadcastEntityMutationEvent(
    event: GenericPostHookEvent<
      BaseOrmEntity,
      EHook.postCreate | EHook.postUpdate | EHook.postDelete
    >,
  ): void {
    const { action, entityName: entity, databaseEntity } = event;

    this.gateway.io.to(entity).emit('entity', {
      entity,
      op: this.postActionToOp(action),
      data: databaseEntity.toPlainCls(),
    });
  }
}
