#!/bin/bash

set -euo pipefail

ROOT_DIR=$(pwd)
TARGET_BRANCH="main"
PUBLISH_PACKAGES=("@hexabot-ai/agentic" "@hexabot-ai/types" "@hexabot-ai/api" "@hexabot-ai/cli" "@hexabot-ai/widget")
BUMP_ONLY_PACKAGES=("@hexabot-ai/frontend")
VERSION_PACKAGES=("${PUBLISH_PACKAGES[@]}" "${BUMP_ONLY_PACKAGES[@]}")
PRERELEASE_TYPES=("prepatch" "preminor" "premajor" "prerelease")
STABLE_RELEASE_TYPES=("patch" "minor" "major")

usage() {
  cat <<'USAGE'
Usage:
  ./bump-version.sh publish <channel> <release-type>
  ./bump-version.sh promote <dist-tag> <version|current> [package...]

Publish channels:
  alpha                 Creates an alpha prerelease and publishes with npm tag "alpha".
  beta                  Creates a beta prerelease and publishes with npm tag "beta".
  stable | final        Creates a final semver release and publishes with npm tag "latest".

Release types:
  alpha/beta            prepatch | preminor | premajor | prerelease
  stable/final          patch | minor | major

Promotion:
  Moves an npm dist-tag to an already-published package version. Use "current"
  to promote each package version currently recorded in package.json.

Examples:
  ./bump-version.sh publish alpha preminor
  ./bump-version.sh publish beta prerelease
  ./bump-version.sh publish stable patch
  ./bump-version.sh promote latest current
  ./bump-version.sh promote latest 3.2.2-alpha.0 @hexabot-ai/api @hexabot-ai/cli
USAGE
}

contains() {
  local needle=$1
  shift

  local item
  for item in "$@"; do
    if [[ "$item" == "$needle" ]]; then
      return 0
    fi
  done

  return 1
}

require_command() {
  local command_name=$1

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required but was not found on PATH."
    exit 1
  fi
}

normalize_channel() {
  local channel=$1

  case "$channel" in
    alpha | beta)
      echo "$channel"
      ;;
    stable | final | latest)
      echo "stable"
      ;;
    *)
      echo "Invalid channel '$channel'. Use alpha, beta, or stable." >&2
      exit 1
      ;;
  esac
}

dist_tag_for_channel() {
  local channel=$1

  if [[ "$channel" == "stable" ]]; then
    echo "latest"
  else
    echo "$channel"
  fi
}

normalize_dist_tag() {
  local dist_tag=$1

  case "$dist_tag" in
    alpha | beta | next)
      echo "$dist_tag"
      ;;
    stable | final | latest)
      echo "latest"
      ;;
    *)
      echo "Invalid dist-tag '$dist_tag'. Use alpha, beta, next, or latest." >&2
      exit 1
      ;;
  esac
}

package_dir() {
  local pkg=$1

  case "$pkg" in
    @hexabot-ai/agentic)
      echo "packages/agentic"
      ;;
    @hexabot-ai/types)
      echo "packages/types"
      ;;
    @hexabot-ai/api)
      echo "packages/api"
      ;;
    @hexabot-ai/cli)
      echo "packages/cli"
      ;;
    @hexabot-ai/widget)
      echo "packages/widget"
      ;;
    *)
      echo "Unsupported package '$pkg'." >&2
      exit 1
      ;;
  esac
}

package_version() {
  local pkg=$1
  local dir

  dir=$(package_dir "$pkg")
  jq -r '.version' "$ROOT_DIR/$dir/package.json"
}

ensure_release_branch() {
  local current_branch

  current_branch=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$current_branch" != "$TARGET_BRANCH" ]]; then
    echo "This command must be executed from the '$TARGET_BRANCH' branch."
    exit 1
  fi
}

ensure_clean_worktree() {
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree is dirty. Commit or stash your changes before releasing."
    exit 1
  fi
}

update_version() {
  local file=$1
  local version=$2

  echo "Updating version in $file to $version"
  jq --arg newVersion "$version" '.version = $newVersion' "$file" >tmp.$$.json && mv tmp.$$.json "$file"
}

publish_release() {
  if [[ $# -ne 2 ]]; then
    usage
    exit 1
  fi

  local channel release_type npm_tag new_version
  channel=$(normalize_channel "$1")
  release_type=$2
  npm_tag=$(dist_tag_for_channel "$channel")

  require_command pnpm
  require_command jq
  require_command git
  ensure_release_branch
  ensure_clean_worktree

  if [[ "$channel" == "stable" ]]; then
    if ! contains "$release_type" "${STABLE_RELEASE_TYPES[@]}"; then
      echo "Invalid stable release type '$release_type'. Use one of: ${STABLE_RELEASE_TYPES[*]}"
      exit 1
    fi
  elif ! contains "$release_type" "${PRERELEASE_TYPES[@]}"; then
    echo "Invalid prerelease type '$release_type'. Use one of: ${PRERELEASE_TYPES[*]}"
    exit 1
  fi

  echo "Preparing $channel release with npm dist-tag '$npm_tag': $release_type"

  local pkg
  for pkg in "${VERSION_PACKAGES[@]}"; do
    echo "Bumping $pkg with release type '$release_type'..."
    if [[ "$channel" == "stable" ]]; then
      pnpm --filter "$pkg" exec npm version "$release_type" --git-tag-version false --commit-hooks false >/dev/null
    else
      pnpm --filter "$pkg" exec npm version "$release_type" --preid "$channel" --git-tag-version false --commit-hooks false >/dev/null
    fi
  done

  new_version=$(jq -r '.version' "$ROOT_DIR/packages/api/package.json")
  if [[ -z "$new_version" || "$new_version" == "null" ]]; then
    echo "Failed to retrieve the new version from packages/api/package.json."
    exit 1
  fi

  if [[ -f "$ROOT_DIR/package.json" ]]; then
    update_version "$ROOT_DIR/package.json" "$new_version"
  fi

  echo "Committing and tagging release..."
  git add .
  git commit -m "build(release): v$new_version"
  git tag "v$new_version"
  git push --no-verify origin "$TARGET_BRANCH" --tags

  echo "Release version bump completed: v$new_version"
  echo "GitHub Actions will publish packages with npm dist-tag '$npm_tag'."
}

promote_dist_tag() {
  if [[ $# -lt 2 ]]; then
    usage
    exit 1
  fi

  local dist_tag version_spec
  dist_tag=$(normalize_dist_tag "$1")
  version_spec=$2
  shift 2

  require_command jq
  require_command npm

  local packages=()
  if [[ $# -gt 0 ]]; then
    packages=("$@")
  else
    packages=("${PUBLISH_PACKAGES[@]}")
  fi

  local targets=()
  local pkg version
  for pkg in "${packages[@]}"; do
    package_dir "$pkg" >/dev/null

    if [[ "$version_spec" == "current" ]]; then
      version=$(package_version "$pkg")
    else
      version=$version_spec
    fi

    targets+=("$pkg@$version")
  done

  echo "Validating published package versions before moving '$dist_tag'..."
  local target
  for target in "${targets[@]}"; do
    echo "Checking $target"
    npm view "$target" version >/dev/null
  done

  echo "Moving npm dist-tag '$dist_tag'..."
  for target in "${targets[@]}"; do
    npm dist-tag add "$target" "$dist_tag"
  done

  echo "Updated npm dist-tags:"
  for pkg in "${packages[@]}"; do
    echo "$pkg"
    npm dist-tag ls "$pkg"
  done
}

main() {
  if [[ $# -eq 0 ]]; then
    usage
    exit 1
  fi

  local command=$1
  shift

  case "$command" in
    publish)
      publish_release "$@"
      ;;
    promote | tag)
      promote_dist_tag "$@"
      ;;
    prepatch | preminor | prerelease)
      echo "Deprecated syntax detected. Use './bump-version.sh publish alpha $command' instead."
      publish_release alpha "$command"
      ;;
    -h | --help | help)
      usage
      ;;
    *)
      echo "Unknown command '$command'."
      usage
      exit 1
      ;;
  esac
}

main "$@"
