/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';

import { HelperController } from './helper.controller';
import { HelperService } from './helper.service';

@Global()
@InjectDynamicProviders(
  // Core & under dev helpers
  'dist/extensions/**/*.helper.js',
  // Installed helpers via npm
  'dist/.hexabot/extensions/helpers/**/*.helper.js',
)
@Module({
  imports: [HttpModule],
  controllers: [HelperController],
  providers: [HelperService],
  exports: [HelperService],
})
export class HelperModule {}
