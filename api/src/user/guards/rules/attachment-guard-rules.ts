/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { TContextType } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';

import { User } from '../../schemas/user.schema';
import { ModelService } from '../../services/model.service';
import { PermissionService } from '../../services/permission.service';
import { Action } from '../../types/action.type';
import { TModel } from '../../types/model.type';

@Injectable()
export class AttachmentGuardRules {
  constructor(
    readonly permissionService: PermissionService,
    readonly modelService: ModelService,
    readonly attachmentService: AttachmentService,
  ) {}

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

  protected async hasRequiredUploadPermission(
    user: Express.User & User,
    context: TContextType,
  ): Promise<boolean> {
    switch (context) {
      case 'setting_attachment': {
        const hasSettingsCreatePermission = await this.hasRequiredPermission(
          user,
          'setting',
          Action.CREATE,
        );
        return hasSettingsCreatePermission;
      }
      case 'user_avatar':
      case 'block_attachment':
      case 'content_attachment':
        return true;
      case 'subscriber_avatar':
      case 'message_attachment':
        return false;
      default:
        return false;
    }
  }

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
}
