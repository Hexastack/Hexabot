/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { I18nService } from './i18n/services/i18n.service';
import { PermissionService } from './user/services/permission.service';
import { UserService } from './user/services/user.service';
import { Action } from './user/types/action.type';
import {
  SocketGet,
  SocketPost,
  SocketReq,
  SocketRequest,
  SocketRes,
  SocketResponse,
  WebsocketGateway,
} from './websocket';

type EntityMutationEvent = {
  metadata?: {
    name?: string;
  };
  entity?: unknown;
  databaseEntity?: unknown;
  entityId?: unknown;
};

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

  @OnEvent('hook:*:postCreate')
  handleEntityCreated(event: EntityMutationEvent) {
    this.broadcastEntityMutationEvent('create', event);
  }

  @OnEvent('hook:*:postUpdate')
  handleEntityUpdated(event: EntityMutationEvent) {
    this.broadcastEntityMutationEvent('update', event);
  }

  @OnEvent('hook:*:postDelete')
  handleEntityDeleted(event: EntityMutationEvent) {
    this.broadcastEntityMutationEvent('delete', event);
  }

  private broadcastEntityMutationEvent(
    op: EntityMutationOperation,
    event: EntityMutationEvent,
  ): void {
    const entity = this.getEntityRoom(event);

    if (!entity) {
      return;
    }

    const data = this.getEventData(event);

    this.gateway.io.to(entity).emit('entity', {
      entity,
      op,
      data,
    });
  }

  private getEntityRoom(event: EntityMutationEvent): string | null {
    const metadataName = event.metadata?.name;

    if (!metadataName) {
      return null;
    }

    return metadataName.replace(/OrmEntity$/, '').toLowerCase();
  }

  private getEventData(event: EntityMutationEvent): unknown {
    if (event.entity) {
      return event.entity;
    }

    if (event.databaseEntity) {
      return event.databaseEntity;
    }

    return typeof event.entityId === 'undefined'
      ? null
      : { id: event.entityId };
  }
}
