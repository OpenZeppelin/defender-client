#!/usr/bin/env bash
# Read root lerna config and update the version of the cross-dependency
VERSION=$(node -p "require('../../lerna.json').version")
FILENAME="package.json"
# Update dependency in deploy package.json
jq '.dependencies["@openzeppelin/defender-base-client"] = $version' --arg version "^$VERSION" $FILENAME > tmp && mv tmp $FILENAME

# Update defender-client version in root package.json
jq '.version = $version' --arg version "$VERSION" ../../$FILENAME > ../../tmp && mv ../../tmp ../../$FILENAME
