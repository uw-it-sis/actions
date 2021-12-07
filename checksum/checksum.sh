#!/bin/bash
#================================================================================================
# Recursively calculates a checksum for all files in the current directory.
#
# To exclude more directories you can add more "-o -type d -name .dirName -prune"s.
#================================================================================================
find . -type d -name .git -prune -o -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum | head -c"$@"