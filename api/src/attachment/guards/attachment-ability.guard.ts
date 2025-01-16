/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Url } from 'url';

import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import qs from 'qs';

import { User } from '@/user/schemas/user.schema';
import { ModelService } from '@/user/services/model.service';
import { PermissionService } from '@/user/services/permission.service';
import { Action } from '@/user/types/action.type';
import { TModel } from '@/user/types/model.type';

import { AttachmentService } from '../services/attachment.service';
import { TAttachmentResourceRef } from '../types';
import {
  isAttachmentResourceRef,
  isAttachmentResourceRefArray,
} from '../utilities';

@Injectable()
export class AttachmentGuard implements CanActivate {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly modelService: ModelService,
    private readonly attachmentService: AttachmentService,
  ) {}

  private permissionMap: Record<
    Action,
    Record<TAttachmentResourceRef, [TModel, Action][]>
  > = {
    // Read attachments by ref
    [Action.READ]: {
      setting_attachment: [
        ['setting', Action.READ],
        ['attachment', Action.READ],
      ],
      user_avatar: [['user', Action.READ]],
      block_attachment: [
        ['block', Action.READ],
        ['attachment', Action.READ],
      ],
      content_attachment: [
        ['content', Action.READ],
        ['attachment', Action.READ],
      ],
      subscriber_avatar: [['subscriber', Action.READ]],
      message_attachment: [
        ['message', Action.READ],
        ['attachment', Action.READ],
      ],
    },
    // Create attachments by ref
    [Action.CREATE]: {
      setting_attachment: [
        ['setting', Action.UPDATE],
        ['attachment', Action.CREATE],
      ],
      user_avatar: [
        // Not authorized, done via /user/:id/edit endpoint
      ],
      block_attachment: [
        ['block', Action.UPDATE],
        ['attachment', Action.CREATE],
      ],
      content_attachment: [
        ['content', Action.UPDATE],
        ['attachment', Action.CREATE],
      ],
      subscriber_avatar: [
        // Not authorized, done programmatically by the channel
      ],
      message_attachment: [
        // Unless we're in case of a handover, done programmatically by the channel
        ['message', Action.CREATE],
        ['attachment', Action.CREATE],
      ],
    },
    // Delete attachments by ref
    [Action.DELETE]: {
      setting_attachment: [
        ['setting', Action.UPDATE],
        ['attachment', Action.DELETE],
      ],
      user_avatar: [
        // Not authorized
      ],
      block_attachment: [
        ['block', Action.UPDATE],
        ['attachment', Action.DELETE],
      ],
      content_attachment: [
        ['content', Action.UPDATE],
        ['attachment', Action.DELETE],
      ],
      subscriber_avatar: [
        // Not authorized, done programmatically by the channel
      ],
      message_attachment: [
        // Not authorized
      ],
    },
    // Update attachments is not possible
    [Action.UPDATE]: {
      setting_attachment: [],
      user_avatar: [],
      block_attachment: [],
      content_attachment: [],
      subscriber_avatar: [],
      message_attachment: [],
    },
  };

  /**
   * Checks if the user has the required permission for a given action and model.
   *
   * @param user - The current authenticated user.
   * @param identity - The model identity being accessed.
   * @param action - The action being performed (e.g., CREATE, READ).
   * @returns A promise that resolves to `true` if the user has the required permission, otherwise `false`.
   */
  private async hasPermission(
    user: Express.User & User,
    identity: TModel,
    action?: Action,
  ) {
    if (Array.isArray(user?.roles)) {
      for (const role of user.roles) {
        const modelObj = await this.modelService.findOne({ identity });
        if (modelObj) {
          const { id: model } = modelObj;
          const hasRequiredPermission = await this.permissionService.findOne({
            action,
            role,
            model,
          });

          return !!hasRequiredPermission;
        }
      }
    }

    return false;
  }

  /**
   * Checks if the user is authorized to perform a given action on a attachment based on the resource reference and user roles.
   *
   * @param action - The action on the attachment.
   * @param user - The current user.
   * @param resourceRef - The resource ref of the attachment (e.g., user_avatar, setting_attachment).
   * @returns A promise that resolves to `true` if the user has the required upload permission, otherwise `false`.
   */
  private async isAuthorized(
    action: Action,
    user: Express.User & User,
    resourceRef: TAttachmentResourceRef,
  ): Promise<boolean> {
    if (!action) {
      throw new TypeError('Invalid action');
    }

    if (!resourceRef) {
      throw new TypeError('Invalid resource ref');
    }

    const permissions = this.permissionMap[action][resourceRef];

    if (!permissions.length) {
      return false;
    }

    return (
      await Promise.all(
        permissions.map(([identity, action]) =>
          this.hasPermission(user, identity, action),
        ),
      )
    ).every(Boolean);
  }

  /**
   * Determines if the user is authorized to perform the requested action.
   *
   * @param ctx - The execution context, providing details of the
   * incoming HTTP request and user information.
   *
   * @returns Returns `true` if the user is authorized, otherwise throws an exception.
   */
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const { query, _parsedUrl, method, user, params } = ctx
      .switchToHttp()
      .getRequest<Request & { user: User; _parsedUrl: Url }>();

    switch (method) {
      // count(), find() and findOne() endpoints
      case 'GET': {
        if (params && 'id' in params && Types.ObjectId.isValid(params.id)) {
          const attachment = await this.attachmentService.findOne(params.id);

          if (!attachment) {
            throw new NotFoundException('Attachment not found!');
          }

          return await this.isAuthorized(
            Action.READ,
            user,
            attachment.resourceRef,
          );
        } else if (query.where) {
          const { resourceRef = [] } = query.where as qs.ParsedQs;

          if (!isAttachmentResourceRefArray(resourceRef)) {
            throw new BadRequestException('Invalid resource ref');
          }

          return (
            await Promise.all(
              resourceRef.map((c) => this.isAuthorized(Action.READ, user, c)),
            )
          ).every(Boolean);
        } else {
          throw new BadRequestException('Invalid params');
        }
      }
      // upload() endpoint
      case 'POST': {
        const { resourceRef = '' } = query;
        if (!isAttachmentResourceRef(resourceRef)) {
          throw new BadRequestException('Invalid resource ref');
        }

        return await this.isAuthorized(Action.CREATE, user, resourceRef);
      }
      // deleteOne() endpoint
      case 'DELETE': {
        if (params && 'id' in params && Types.ObjectId.isValid(params.id)) {
          const attachment = await this.attachmentService.findOne(params.id);

          if (!attachment) {
            throw new NotFoundException('Invalid attachment ID');
          }

          return await this.isAuthorized(
            Action.DELETE,
            user,
            attachment.resourceRef,
          );
        } else {
          throw new BadRequestException('Invalid params');
        }
      }
      default:
        throw new BadRequestException('Invalid operation');
    }
  }
}
