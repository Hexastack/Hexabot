# Release & Branching Guide

Hexabot v3 is released from `main`.

## Continuous Integration

Pull requests targeting `main` trigger `.github/workflows/main-ci.yml`, which runs the full workspace gate:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Publishing

Use `./bump-version.sh <release-type>` from a clean `main` branch to create v3 alpha releases. The script bumps published packages (`@hexabot-ai/agentic`, `@hexabot-ai/types`, `@hexabot-ai/api`, `@hexabot-ai/cli`, and `@hexabot-ai/widget`) plus the private frontend package so static assets stay version-aligned.

Publishing is handled by `.github/workflows/alpha-npm.yml`, which runs when a `v3.*-alpha.*` tag is pushed and publishes packages to npm with the `alpha` dist-tag.

Allowed `<release-type>` values:

- `prepatch` → bumps to the next patch pre-release (e.g., `3.0.1-alpha.0`)
- `preminor` → bumps to the next minor pre-release (e.g., `3.1.0-alpha.0`)
- `prerelease` → increments the existing alpha identifier (e.g., `3.0.1-alpha.1`)

What the script does:

1. Ensures you are on a clean `main` branch.
2. Bumps package versions with the `alpha` pre-release id.
3. Synchronizes the root `package.json` version.
4. Commits the version bump, tags it as `v<version>`, and pushes back to `origin main`.

Once the tag is pushed, GitHub Actions takes over to install dependencies, build, and publish alpha packages to npm.

Before running:

- Install dependencies (`pnpm install`) and ensure the repository is clean.

Example alpha release that increments the current prerelease tag:

```bash
./bump-version.sh prerelease
```
