/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query, Types } from 'mongoose';

import { I18nService } from '@/i18n/services/i18n.service';
import { BaseRepository } from '@/utils/generics/base-repository';

import { Setting } from '../schemas/setting.schema';

@Injectable()
export class SettingRepository extends BaseRepository<Setting> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(Setting.name) readonly model: Model<Setting>,
    private readonly i18n: I18nService,
  ) {
    super(eventEmitter, model, Setting);
  }

  /**
   * Validates the `Setting` document after it has been retrieved.
   *
   * Checks the `type` of the setting and validates the `value` field according to the type:
   * - `text` expects a string.
   * - `multiple_text` expects an array of strings.
   * - `checkbox` expects a boolean.
   *
   * @param setting The `Setting` document to be validated.
   */
  async postValidate(
    setting: Document<unknown, unknown, Setting> &
      Setting & { _id: Types.ObjectId },
  ) {
    if (setting.type === 'text' && typeof setting.value !== 'string') {
      throw new Error('Setting Model : Value must be a string!');
    } else if (setting.type === 'multiple_text') {
      const isStringArray =
        Array.isArray(setting.value) &&
        setting.value.every((v) => {
          return typeof v === 'string';
        });
      if (!isStringArray) {
        throw new Error('Setting Model : Value must be a string array!');
      }
    } else if (
      setting.type === 'checkbox' &&
      typeof setting.value !== 'boolean'
    ) {
      throw new Error('Setting Model : Value must be a boolean!');
    }
  }

  /**
   * Emits an event after a `Setting` has been updated.
   *
   * This method is used to synchronize global settings by emitting an event
   * based on the `group` and `label` of the `Setting`.
   *
   * @param _query The Mongoose query object used to find and update the document.
   * @param setting The updated `Setting` object.
   */
  async postUpdate(
    _query: Query<
      Document<Setting, any, any>,
      Document<Setting, any, any>,
      unknown,
      Setting,
      'findOneAndUpdate'
    >,
    setting: Setting,
  ) {
    const group = setting.group as any;
    const label = setting.label as string;
    // Sync global settings var
    this.eventEmitter.emit(`hook:${group}:${label}`, setting as any);
  }
}
