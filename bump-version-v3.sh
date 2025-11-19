#!/bin/bash

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <release-type>"
  echo "release-type: prepatch | preminor | prerelease"
  exit 1
fi

RELEASE_TYPE=$1
ROOT_DIR=$(pwd)
TARGET_BRANCH="dev"
PUBLISH_PACKAGES=("@hexabot-ai/api" "@hexabot-ai/cli" "@hexabot-ai/widget")
BUMP_ONLY_PACKAGES=("@hexabot-ai/frontend")
VERSION_PACKAGES=("${PUBLISH_PACKAGES[@]}" "${BUMP_ONLY_PACKAGES[@]}")
ALLOWED_RELEASE_TYPES=("prepatch" "preminor" "prerelease")

if [[ ! " ${ALLOWED_RELEASE_TYPES[*]} " =~ " ${RELEASE_TYPE} " ]]; then
  echo "Invalid release type. Use one of: ${ALLOWED_RELEASE_TYPES[*]}"
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
  echo "This script must be executed from the '$TARGET_BRANCH' branch."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit or stash your changes before releasing."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required but not found on PATH."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but not found on PATH."
  exit 1
fi

echo "Executing v3 alpha release: $RELEASE_TYPE"

for pkg in "${VERSION_PACKAGES[@]}"; do
  echo "Bumping $pkg to next $RELEASE_TYPE (alpha)..."
  pnpm --filter "$pkg" exec npm version "$RELEASE_TYPE" --preid alpha --git-tag-version false --commit-hooks false >/dev/null
done

NEW_VERSION=$(jq -r '.version' "$ROOT_DIR/packages/api/package.json")

if [[ -z "$NEW_VERSION" ]]; then
  echo "Failed to retrieve the new version from packages/api/package.json."
  exit 1
fi

update_version() {
  local file=$1
  echo "Updating version in $file to $NEW_VERSION"
  jq --arg newVersion "$NEW_VERSION" '.version = $newVersion' "$file" > tmp.$$.json && mv tmp.$$.json "$file"
}

if [[ -f "$ROOT_DIR/package.json" ]]; then
  update_version "$ROOT_DIR/package.json"
fi

echo "Committing and tagging release..."
git add .
git commit -m "build(v3): v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push --no-verify origin "$TARGET_BRANCH" --tags

echo "Version bump completed for v3 alpha ($NEW_VERSION)."
echo "GitHub Actions will publish the packages once the tag is pushed."
