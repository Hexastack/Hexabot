/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { IHookSettingsGroupLabelOperationMap } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import {
  Document,
  FilterQuery,
  Model,
  Query,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { Setting } from '../schemas/setting.schema';
import { SettingType } from '../schemas/types';

@Injectable()
export class SettingRepository extends BaseRepository<Setting> {
  constructor(@InjectModel(Setting.name) readonly model: Model<Setting>) {
    super(model, Setting);
  }

  async preCreateValidate(
    doc: Document<unknown, unknown, Setting> &
      Setting & { _id: Types.ObjectId },
  ) {
    this.validateSettingValue(doc.type, doc.value);
  }

  async preUpdateValidate(
    criteria: FilterQuery<Setting>,
    updates: UpdateWithAggregationPipeline | UpdateQuery<Setting>,
  ): Promise<void> {
    if (!Array.isArray(updates)) {
      const payload = updates.$set;
      if (payload && 'value' in payload) {
        const hasType = 'type' in payload;
        if (hasType) {
          // Case when we need to update both the type and value
          this.validateSettingValue(payload.type, payload.value);
        } else {
          // Case when we only update the setting value
          const setting = await this.findOne(criteria);
          if (setting && 'type' in setting) {
            this.validateSettingValue(setting.type, payload.value);
          } else {
            throw new Error('Unable to find the setting to be updated');
          }
        }
      }
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
    const group = setting.group as keyof IHookSettingsGroupLabelOperationMap;
    const label = setting.label as '*';

    // Sync global settings var
    this.eventEmitter.emit(`hook:${group}:${label}`, setting);
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
  public validateSettingValue(type: SettingType, value: any) {
    if (
      (type === SettingType.text || type === SettingType.textarea) &&
      typeof value !== 'string' &&
      value !== null
    ) {
      throw new Error('Setting Model : Value must be a string!');
    } else if (type === SettingType.multiple_text) {
      if (!this.isArrayOfString(value)) {
        throw new Error(
          'Setting Model (Multiple Text) : Value must be a string array!',
        );
      }
    } else if (
      type === SettingType.checkbox &&
      typeof value !== 'boolean' &&
      value !== null
    ) {
      throw new Error('Setting Model : Value must be a boolean!');
    } else if (
      type === SettingType.number &&
      typeof value !== 'number' &&
      value !== null
    ) {
      throw new Error('Setting Model : Value must be a number!');
    } else if (type === SettingType.multiple_attachment) {
      if (!this.isArrayOfString(value)) {
        throw new Error(
          'Setting Model (Multiple Attachement): Value must be a string array!',
        );
      }
    } else if (type === SettingType.attachment) {
      if (typeof value !== 'string' && typeof value !== null) {
        throw new Error(
          'Setting Model (attachement): Value must be a string or null !',
        );
      }
    } else if (type === SettingType.secret && typeof value !== 'string') {
      throw new Error('Setting Model (secret) : Value must be a string');
    } else if (type === SettingType.select && typeof value !== 'string') {
      throw new Error('Setting Model (select): Value must be a string!');
    }
  }

  private isArrayOfString(value: any): boolean {
    return Array.isArray(value) && value.every((v) => typeof v === 'string');
  }
}
