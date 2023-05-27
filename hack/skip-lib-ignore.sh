#!/usr/bin/env bash
grep -v 'lib' ./.gitignore > .gitignore.tmp && mv .gitignore.tmp .gitignore
