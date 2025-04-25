/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import settingSchema, { Setting } from '@/setting/schemas/setting.schema';
import { SettingType } from '@/setting/schemas/types';

import { MigrationServices } from '../types';

const addDefaultNluPenaltyFactor = async ({ logger }: MigrationServices) => {
  const SettingModel = mongoose.model<Setting>(Setting.name, settingSchema);
  try {
    await SettingModel.updateOne(
      {
        group: 'chatbot_settings',
        label: 'default_nlu_penalty_factor',
      },
      {
        group: 'chatbot_settings',
        label: 'default_nlu_penalty_factor',
        value: 0.95,
        type: SettingType.number,
        config: {
          min: 0,
          max: 1,
          step: 0.01,
        },
        weight: 2,
      },
      {
        upsert: true,
      },
    );
    logger.log('Successfuly added the default NLU penalty factor setting');
  } catch (err) {
    logger.error('Unable to add the default NLU penalty factor setting');
  }
};

const removeDefaultNluPenaltyFactor = async ({ logger }: MigrationServices) => {
  const SettingModel = mongoose.model<Setting>(Setting.name, settingSchema);
  try {
    await SettingModel.deleteOne({
      group: 'chatbot_settings',
      label: 'default_nlu_penalty_factor',
    });
    logger.log('Successfuly removed the default NLU penalty factor setting');
  } catch (err) {
    logger.error('Unable to remove the default local storage helper setting');
  }
};

module.exports = {
  async up(services: MigrationServices) {
    await addDefaultNluPenaltyFactor(services);
    return true;
  },
  async down(services: MigrationServices) {
    await removeDefaultNluPenaltyFactor(services);
    return true;
  },
};
