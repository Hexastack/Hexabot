#!/bin/bash

# Ensure script exits on any command failure
set -e

# Check if a release type argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <release-type>"
  echo "release-type: patch | minor"
  exit 1
fi

RELEASE_TYPE=$1
ROOT_DIR=$(pwd)

if [[ "$RELEASE_TYPE" != "patch" && "$RELEASE_TYPE" != "minor" ]]; then
  echo "Invalid release type. Use 'patch' or 'minor'."
  exit 1
fi

echo "Executing release: $RELEASE_TYPE"

# Execute the appropriate npm release command
if [[ "$RELEASE_TYPE" == "patch" ]]; then
  npm run release:patch
elif [[ "$RELEASE_TYPE" == "minor" ]]; then
  npm run release:minor
fi

# Retrieve the new version from package.json
NEW_VERSION=$(jq -r '.version' "$ROOT_DIR/package.json")

if [ -z "$NEW_VERSION" ]; then
  echo "Failed to retrieve the version from package.json."
  exit 1
fi


# Commit and push changes
echo "Committing and pushing changes..."
git add .
git commit -m "build: v$NEW_VERSION"

# Add git tag
echo "Tagging version v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin main --tags

echo "Release ($RELEASE_TYPE) completed successfully."
