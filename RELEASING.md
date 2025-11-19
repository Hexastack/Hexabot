# Release & Branching Guide

Hexabot keeps two parallel release trains:

- `main` tracks **v2**. All stable releases for production are cut from this branch.
- `dev` tracks **v3**. Alpha builds are produced here until we graduate to a stable release.

## Continuous Integration

- **v2 (main)** → `.github/workflows/v2-pull_request.yml`  
  Runs the legacy package-specific checks whenever a pull request targets `main`.
- **v3 (dev)** → `.github/workflows/v3-dev-ci.yml`  
  Runs `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` (fan-out via Turbo) whenever a pull request targets `dev`. This ensures every package is validated before merging into the v3 branch.

## Publishing

### Stable (v2)

`bump-version.sh` remains the entry point for releasing v2 artifacts from `main`. It accepts `patch` or `minor` to bump versions, tags the release, and pushes back to `main`.

### Alpha (v3)

Use `./bump-version-v3.sh <release-type>` from the `dev` branch to bump `@hexabot-ai/api`, `@hexabot-ai/cli`, and `@hexabot-ai/widget` before pushing a `v3.*-alpha.*` tag. The script also bumps `@hexabot-ai/frontend` so its static build (copied into the API output) stays in sync, even though we do not publish the frontend package yet. Publishing is handled by the **Publish Hexabot V3 Alpha Packages** workflow, which builds and publishes the three alpha packages with the `alpha` dist-tag as soon as the release tag is pushed.

Allowed `<release-type>` values:

- `prepatch` → bumps to the next patch pre-release (e.g., `3.0.1-alpha.0`)
- `preminor` → bumps to the next minor pre-release (e.g., `3.1.0-alpha.0`)
- `prerelease` → increments the existing alpha identifier (e.g., `3.0.1-alpha.1`)

What the script does:

1. Ensures you are on a clean `dev` branch.
2. Bumps the version for the API, CLI, widget, and frontend packages with the `alpha` pre-release id (frontend is versioned but not published).
3. Synchronizes the root `package.json` version.
4. Commits the version bump, tags it as `v<version>`, and pushes back to `origin dev`.

Once the tag is pushed, GitHub Actions takes over to install dependencies, build, and publish the API, CLI, and widget packages under the `alpha` tag on npm.

Before running:

- Install dependencies (`pnpm install`) and ensure the repository is clean.

Example alpha release that increments the current prerelease tag:

```bash
./bump-version-v3.sh prerelease
```

This will create the `v3.*-alpha.*` tag and automatically trigger the workflow that publishes `@hexabot-ai/api`, `@hexabot-ai/cli`, and `@hexabot-ai/widget` under the `alpha` dist-tag on npm while leaving the v2 workflow untouched.
