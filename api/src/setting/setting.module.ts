/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { SettingController } from './controllers/setting.controller';
import { SettingRepository } from './repositories/setting.repository';
import { SettingModel } from './schemas/setting.schema';
import { SettingSeeder } from './seeds/setting.seed';
import { SettingService } from './services/setting.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([SettingModel]),
    PassportModule.register({
      session: true,
    }),
  ],
  providers: [SettingRepository, SettingSeeder, SettingService],
  controllers: [SettingController],
  exports: [SettingService],
})
export class SettingModule {}
