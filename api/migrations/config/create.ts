/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

import { escapeRegularExpression } from '@/utils/helpers/string';

// Get the argument passed (e.g., "all-users-fr")
const arg: string | undefined = process.argv[2];

// Check if the argument exists
if (!arg) {
  console.error('Please provide a name for a new migration.');
  process.exit(1);
}
// Define the path to the migrations directory and the template file
const migrationsDir: string = path.join(__dirname, '../');
const templatePath: string = path.join(__dirname, '../config/template.ts');

// Check if a migration with the same name (excluding timestamp) already exists
const migrationExists: boolean = fs.readdirSync(migrationsDir).some((file) => {
  const escapedRegExp = escapeRegularExpression(arg);
  const regex = new RegExp(`^[0-9]+-${escapedRegExp}\.ts$`);
  return regex.test(file);
});

if (migrationExists) {
  console.error(`A migration with the name "${arg}" already exists.`);
  process.exit(1);
}

// Generate a timestamp
const timestamp: string = Date.now().toString();

// Create the filename using the timestamp and argument
const filename: string = `${timestamp}-${arg}.ts`;

// Read the template content from the file
let template: string;
try {
  template = fs.readFileSync(templatePath, 'utf8');
} catch (err) {
  console.error('Error reading template file:', err);
  process.exit(1);
}

// Define the full path to save the file
const filePath: string = path.join(migrationsDir, filename);

// Write the template to the file
fs.writeFile(filePath, template, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log(`File created: ${filename}`);
  }
});
