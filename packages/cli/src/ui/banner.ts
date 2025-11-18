/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import chalk from 'chalk';
import figlet from 'figlet';

export const printBanner = () => {
  console.log(chalk.blue(figlet.textSync('Hexabot')));
};
