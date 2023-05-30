#!/usr/bin/env bash
# Update the cross-dependency version in the deploy package.json and root package.json
# Read root lerna config and update the version of the cross-dependency
VERSION=$(node -p "require('./lerna.json').version")

FILENAME="package.json"
DEPLOY_PACKAGE_FILENAME="packages/deploy/${FILENAME}"

# Update dependency in deploy package.json
jq '.dependencies["@openzeppelin/defender-base-client"] = $version' --arg version "^$VERSION" $DEPLOY_PACKAGE_FILENAME > tmp && mv tmp $DEPLOY_PACKAGE_FILENAME

# Update defender-client version in root package.json
jq '.version = $version' --arg version "$VERSION" $FILENAME > tmp && mv tmp $FILENAME
