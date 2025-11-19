#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('node:fs');
const path = require('node:path');

const apiRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(apiRoot, 'types');
const distDir = path.join(apiRoot, 'dist');
const destinationDir = path.join(distDir, 'types');

if (!fs.existsSync(sourceDir)) {
  console.error('[hexabot] Unable to find types directory to copy.');
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });
if (fs.existsSync(destinationDir)) {
  fs.rmSync(destinationDir, { recursive: true, force: true });
}

fs.cpSync(sourceDir, destinationDir, { recursive: true });
console.log('[hexabot] Copied type declarations to dist/types');
