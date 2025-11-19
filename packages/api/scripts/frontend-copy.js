#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Copies the built frontend bundle into the API dist folder so Nest can serve it.
 */

const fs = require('node:fs');
const path = require('node:path');

const apiRoot = path.resolve(__dirname, '..');
const frontendDistSource = path.resolve(apiRoot, '..', 'frontend', 'dist');
const frontendDistTarget = path.resolve(apiRoot, 'dist', 'static');

if (!fs.existsSync(frontendDistSource)) {
  console.error(
    `[hexabot] Missing frontend build output at ${frontendDistSource}. Make sure @hexabot-ai/frontend builds successfully.`,
  );
  process.exit(1);
}

fs.rmSync(frontendDistTarget, { recursive: true, force: true });
fs.mkdirSync(path.dirname(frontendDistTarget), { recursive: true });
fs.cpSync(frontendDistSource, frontendDistTarget, { recursive: true });

console.log(
  `[hexabot] Copied frontend assets to ${path.relative(apiRoot, frontendDistTarget)}`,
);
