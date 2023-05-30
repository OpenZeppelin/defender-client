#!/usr/bin/env bash

# When provenance runs it uses `npm pack` to create a tarball of the package. By default it will ignore any files listed in .gitignore.
# This is a problem for us because we want to include the lib folder in the tarball. This script removes the lib folder from .gitignore
grep -v 'lib' ./.gitignore > .gitignore.tmp && mv .gitignore.tmp .gitignore
