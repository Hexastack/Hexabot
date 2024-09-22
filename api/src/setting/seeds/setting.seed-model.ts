/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { config } from '@/config';

import { SettingCreateDto } from '../dto/setting.dto';
import { SettingType } from '../schemas/types';

export const settingModels: SettingCreateDto[] = [
  {
    group: 'chatbot_settings',
    label: 'global_fallback',
    value: true,
    type: SettingType.checkbox,
    weight: 1,
  },
  {
    group: 'chatbot_settings',
    label: 'fallback_block',
    value: '',
    options: [],
    type: SettingType.select,
    config: {
      multiple: false,
      allowCreate: false,
      source: '/Block/',
      valueKey: 'id',
      labelKey: 'name',
    },
    weight: 2,
  },
  {
    group: 'chatbot_settings',
    label: 'fallback_message',
    value: [
      "Sorry but i didn't understand your request. Maybe you can check the menu",
      "I'm really sorry but i don't quite understand what you are saying :(",
    ],
    type: SettingType.multiple_text,
    weight: 3,
  },
  {
    group: 'nlp_settings',
    label: 'provider',
    value: 'default',
    options: ['default'],
    type: SettingType.select,
    weight: 1,
  },
  {
    group: 'nlp_settings',
    label: 'endpoint',
    value: 'http://nlu-api:5000/',
    type: SettingType.text,
    weight: 2,
  },
  {
    group: 'nlp_settings',
    label: 'token',
    value: 'token123',
    type: SettingType.text,
    weight: 3,
  },
  {
    group: 'nlp_settings',
    label: 'languages',
    value: [],
    options: [],
    type: SettingType.select,
    config: {
      multiple: true,
      allowCreate: true,
    },
    weight: 4,
  },
  {
    group: 'nlp_settings',
    label: 'default_lang',
    value: config.chatbot.lang.default,
    options: [], // NOTE : will be set onBeforeCreate from config
    type: SettingType.select,
    weight: 5,
  },
  {
    group: 'nlp_settings',
    label: 'threshold',
    value: 0.9,
    type: SettingType.number,
    config: {
      min: 0,
      max: 1,
      step: 0.01,
    },
    weight: 6,
  },
  {
    group: 'contact',
    label: 'contact_email_recipient',
    value: 'admin@example.com',
    type: SettingType.text,
    weight: 1,
  },
  {
    group: 'contact',
    label: 'company_name',
    value: 'Your company name',
    type: SettingType.text,
    weight: 2,
  },
  {
    group: 'contact',
    label: 'company_phone',
    value: '(+999) 9999 9999 999',
    type: SettingType.text,
    weight: 3,
  },
  {
    group: 'contact',
    label: 'company_email',
    value: 'contact[at]mycompany.com',
    type: SettingType.text,
    weight: 4,
  },
  {
    group: 'contact',
    label: 'company_address1',
    value: '71 Pilgrim Avenue',
    type: SettingType.text,
    weight: 5,
  },
  {
    group: 'contact',
    label: 'company_address2',
    value: '',
    type: SettingType.text,
    weight: 6,
  },
  {
    group: 'contact',
    label: 'company_city',
    value: 'Chevy Chase',
    type: SettingType.text,
    weight: 7,
  },
  {
    group: 'contact',
    label: 'company_zipcode',
    value: '85705',
    type: SettingType.text,
    weight: 8,
  },
  {
    group: 'contact',
    label: 'company_state',
    value: 'Orlando',
    type: SettingType.text,
    weight: 9,
  },
  {
    group: 'contact',
    label: 'company_country',
    value: 'US',
    type: SettingType.text,
    weight: 10,
  },
];
