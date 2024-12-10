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

import { NlpModule } from '@/nlp/nlp.module';

import { HelperController } from './helper.controller';
import { HelperService } from './helper.service';

@Global()
@InjectDynamicProviders(
  // Core & under dev helpers
  'dist/extensions/**/*.helper.js',
  // Community extensions installed via npm
  'dist/.hexabot/contrib/extensions/helpers/**/*.helper.js',
  // Custom extensions under dev
  'dist/.hexabot/custom/extensions/helpers/**/*.helper.js',
)
@Module({
  imports: [HttpModule, NlpModule],
  controllers: [HelperController],
  providers: [HelperService],
  exports: [HelperService],
})
export class HelperModule {}
