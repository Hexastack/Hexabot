# Release & Publishing Guide

Hexabot v3 is released from `main`.

## Continuous Integration

Pull requests targeting `main` trigger `.github/workflows/main-ci.yml`, which
runs the full workspace gate:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Publishing

This section is the maintainer workflow for publishing the public npm packages
in this repository.

### Public Packages

The release tooling publishes these packages:

- `@hexabot-ai/agentic`
- `@hexabot-ai/types`
- `@hexabot-ai/api`
- `@hexabot-ai/cli`
- `@hexabot-ai/widget`

`@hexabot-ai/frontend` is private and is versioned with releases so packaged
static assets stay aligned. It is not published to npm.

### Release Channels

Use npm dist-tags as release channels.

| Channel | Version shape | npm dist-tag | Default install? |
| --- | --- | --- | --- |
| Alpha | `X.Y.Z-alpha.N` | `alpha` | No |
| Beta | `X.Y.Z-beta.N` | `beta` | No |
| Stable/final | `X.Y.Z` | `latest` | Yes |

`latest` is what users get from `npm install @hexabot-ai/cli` without a version
or tag. Keep `latest` for stable releases unless there is an explicit maintainer
decision to promote a prerelease.

### Prerequisites

Before publishing:

1. Be on `main`.
2. Pull the latest changes.
3. Ensure the working tree is clean.
4. Run the relevant validation, preferably the full workspace gate:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

GitHub Actions publishes with the `V3_NPM_TOKEN` secret. Local dist-tag
promotion through `bump-version.sh promote` requires a local npm session with
permission to manage `@hexabot-ai/*` packages.

### Creating A New Release

Use `bump-version.sh publish` from the repository root:

```bash
./bump-version.sh publish <channel> <release-type>
```

Allowed channels:

- `alpha`
- `beta`
- `stable` or `final`

Allowed release types:

- For `alpha` and `beta`: `prepatch`, `preminor`, `premajor`, `prerelease`
- For `stable`/`final`: `patch`, `minor`, `major`

Use the release channel to decide who should install the build:

| Use case | Command example | npm tag |
| --- | --- | --- |
| First test build for the next minor version | `./bump-version.sh publish alpha preminor` | `alpha` |
| Another alpha build of the same version | `./bump-version.sh publish alpha prerelease` | `alpha` |
| First beta after alpha validation | `./bump-version.sh publish beta prerelease` | `beta` |
| Another beta build of the same version | `./bump-version.sh publish beta prerelease` | `beta` |
| Final production release | `./bump-version.sh publish stable patch` | `latest` |

Use the release type to decide how the version changes:

| Release type | Example result |
| --- | --- |
| `preminor` | `3.2.2-alpha.0` -> `3.3.0-alpha.0` |
| `prepatch` | `3.2.2-alpha.0` -> `3.2.3-alpha.0` |
| `prerelease` | `3.3.0-alpha.0` -> `3.3.0-alpha.1` |
| `patch` | `3.3.0-beta.2` -> `3.3.0`, or `3.3.0` -> `3.3.1` |
| `minor` | `3.3.0` -> `3.4.0` |
| `major` | `3.3.0` -> `4.0.0` |

Common examples:

```bash
./bump-version.sh publish alpha preminor
./bump-version.sh publish alpha prerelease
./bump-version.sh publish beta prerelease
./bump-version.sh publish stable patch
```

The script:

1. Verifies that you are on a clean `main` branch.
2. Bumps the public packages and the private frontend package.
3. Updates the root `package.json` version from `packages/api/package.json`.
4. Commits the version bump.
5. Creates a `v<api-version>` git tag.
6. Pushes `main` and tags to `origin`.

The git tag uses the API package version as the release-train version. Individual
public packages can still have different package versions if their histories
have diverged.

The pushed tag starts `.github/workflows/npm-publish.yml`. That workflow derives
the npm dist-tag from the git tag:

- `vX.Y.Z-alpha.N` publishes with `--tag alpha`
- `vX.Y.Z-beta.N` publishes with `--tag beta`
- `vX.Y.Z` publishes with `--tag latest`

Monitor the `Publish Hexabot Packages` workflow after running the script.

### Choosing The Release Type

Use these rules for normal releases:

- New alpha train for the next minor: `publish alpha preminor`
- New alpha patch prerelease: `publish alpha prepatch`
- Another alpha build of the same version: `publish alpha prerelease`
- Promote the current prerelease train to beta: `publish beta prerelease`
- Another beta build of the same version: `publish beta prerelease`
- Finalize a prerelease version: `publish stable patch`

For example, from `3.3.0-beta.2`, `publish stable patch` produces `3.3.0`.
From an already stable `3.3.0`, `publish stable patch` produces `3.3.1`.

### Promoting An Existing Version

Promotion moves an npm dist-tag to an already-published tarball. It does not
rebuild, republish, commit, or tag git.

Promote the versions currently recorded in each package manifest:

```bash
./bump-version.sh promote latest current
```

Promote a specific package version:

```bash
./bump-version.sh promote latest 3.2.2-alpha.0 @hexabot-ai/api @hexabot-ai/cli
```

Use `current` when package versions differ. A single explicit version only works
for packages where that exact version already exists on npm.

You can also promote from GitHub:

1. Open the `Promote npm Dist Tag` workflow.
2. Run it manually with:
   - `dist_tag`: `latest`, `beta`, `alpha`, or `next`
   - `version`: `current` or an exact version
   - `packages`: optional space-separated package names
3. Review the workflow summary and npm dist-tags after it completes.

### Verifying npm State

Check package tags:

```bash
npm dist-tag ls @hexabot-ai/api
npm dist-tag ls @hexabot-ai/cli
npm dist-tag ls @hexabot-ai/widget
npm dist-tag ls @hexabot-ai/types
npm dist-tag ls @hexabot-ai/agentic
```

Check what default installs resolve to:

```bash
npm view @hexabot-ai/api@latest version
npm view @hexabot-ai/api@alpha version
npm view @hexabot-ai/api@beta version
```

### Troubleshooting

- If `npm install @hexabot-ai/<pkg>` resolves to an older version, inspect the
  `latest` dist-tag. Publishing an alpha or beta does not move `latest`.
- If promotion fails for one package, verify that the requested version exists
  for that package with `npm view <pkg>@<version> version`.
- If a publish workflow is re-run after a successful publish, npm may reject the
  package because the version already exists. Use dist-tag promotion instead of
  republishing an existing version.
- Do not publish manually from a workstation unless maintainers explicitly agree
  to bypass the GitHub Actions workflow.
