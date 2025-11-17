#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Ensures the frontend is built when the API build runs outside of Turbo's graph.
 */

const { execSync } = require('node:child_process');
const path = require('node:path');

const isTurboTask = Boolean(
  process.env.TURBO_HASH_KEY ||
    process.env.TURBO_PIPELINE_HASH ||
    process.env.TURBO_TASK_ID ||
    process.env.TURBO_TEAM_ID ||
    process.env.TURBO_TEAMID,
);

if (isTurboTask) {
  console.log(
    '[hexabot] Turbo detected, relying on dependency graph for @hexabot/frontend build.',
  );
  process.exit(0);
}

const apiRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(apiRoot, '..', '..');

console.log('[hexabot] Building @hexabot/frontend before Nest build...');
execSync('pnpm --filter @hexabot/frontend build', {
  cwd: workspaceRoot,
  stdio: 'inherit',
});
