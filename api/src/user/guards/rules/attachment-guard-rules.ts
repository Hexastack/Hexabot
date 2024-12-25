/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Url } from 'url';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

import { TAttachmentContextType } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';

import { User } from '../../schemas/user.schema';
import { ModelService } from '../../services/model.service';
import { PermissionService } from '../../services/permission.service';
import { Action } from '../../types/action.type';
import { TModel } from '../../types/model.type';

@Injectable()
export class AttachmentGuard implements CanActivate {
  constructor(
    readonly permissionService: PermissionService,
    readonly modelService: ModelService,
    readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Checks if the user has the required permission for a given action and model.
   *
   * @param user - The current authenticated user.
   * @param identity - The model identity being accessed.
   * @param action - The action being performed (e.g., CREATE, READ).
   * @returns A promise that resolves to `true` if the user has the required permission, otherwise `false`.
   */
  private async hasRequiredPermission(
    user: Express.User & User,
    identity: TModel,
    action?: Action,
  ) {
    if (user?.roles)
      for (const role of user.roles) {
        const model = (await this.modelService.findOne({ identity }))?.id;
        const hasRequiredPermission = await this.permissionService.findOne({
          action,
          role,
          model,
        });

        if (hasRequiredPermission) return true;
      }

    return false;
  }

  /**
   * Checks if the user has permission to upload an attachment based on its context.
   *
   * @param user - The current user.
   * @param context - The context of the attachment (e.g., user_avatar, setting_attachment).
   * @returns A promise that resolves to `true` if the user has the required upload permission, otherwise `false`.
   */
  protected async hasRequiredUploadPermission(
    user: Express.User & User,
    context: TAttachmentContextType,
  ): Promise<boolean> {
    switch (context) {
      case 'setting_attachment': {
        return await this.hasRequiredPermission(user, 'setting', Action.UPDATE);
      }
      case 'user_avatar':
      case 'block_attachment':
      case 'content_attachment':
        return true;
      case 'subscriber_avatar':
      case 'message_attachment':
        // upload is done programmatically, accessible to subscribers and users with inbox permissions
        return false;
      default:
        return false;
    }
  }

  /**
   * Checks if the user has permission to download an attachment based on its context.
   *
   * @param user - The current authenticated user.
   * @param attachmentId - The ID of the attachment being accessed.
   * @returns A promise that resolves to `true` if the user has the required download permission, otherwise `false`.
   */
  protected async hasRequiredDownloadPermission(
    user: Express.User & User,
    attachmentId: string,
  ): Promise<boolean> {
    const { context = '' } =
      (await this.attachmentService.findOne(attachmentId)) || {};

    switch (context) {
      case 'block_attachment':
      case 'content_attachment':
        return true;
      case 'setting_attachment': {
        const hasSettingsReadPermission = await this.hasRequiredPermission(
          user,
          'setting',
          Action.READ,
        );
        return hasSettingsReadPermission;
      }
      case 'user_avatar': {
        const hasUsersReadPermission = await this.hasRequiredPermission(
          user,
          'user',
          Action.READ,
        );
        const hasMessagesReadPermission = await this.hasRequiredPermission(
          user,
          'message',
          Action.READ,
        );
        return hasUsersReadPermission || hasMessagesReadPermission;
      }
      case 'subscriber_avatar': {
        const hasSubscriberReadPermission = await this.hasRequiredPermission(
          user,
          'subscriber',
          Action.READ,
        );

        return hasSubscriberReadPermission;
      }
      case 'message_attachment': {
        const hasMessagesReadPermission = await this.hasRequiredPermission(
          user,
          'message',
          Action.READ,
        );

        return hasMessagesReadPermission;
      }
      default:
        return false;
    }
  }

  /**
   * Determines if the current request is authorized to access the attachment resource.
   *
   * @param context - The execution context of the request.
   * @returns A promise that resolves to `true` if the request is authorized, otherwise `false`.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user, method, _parsedUrl, query } = context
      .switchToHttp()
      .getRequest<Request & { user: User; _parsedUrl: Url }>();
    const [_, _controller, action, id] = _parsedUrl.pathname.split('/');

    // attachment
    const attachmentUploadContext =
      query?.context?.toString() as TAttachmentContextType;

    if (method === 'POST' && action === 'upload' && attachmentUploadContext) {
      return await this.hasRequiredUploadPermission(
        user,
        attachmentUploadContext,
      );
    } else if (method === 'GET' && action === 'download') {
      return await this.hasRequiredDownloadPermission(user, id);
    } else {
      return false;
    }
  }
}
