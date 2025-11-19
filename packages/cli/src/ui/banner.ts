/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import chalk from 'chalk';
import figlet from 'figlet';

import { getCliVersion } from '../utils/version.js';

export const printBanner = () => {
  const bannerText = chalk.blue(figlet.textSync('Hexabot'));
  const versionText = chalk.gray(`CLI v${getCliVersion()}`);

  console.log(bannerText);
  console.log(versionText);
};
