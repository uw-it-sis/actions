#!/bin/bash -l
#================================================================================

set -euo pipefail

# Packages known to cause problems when duplicated. Add/remove entries here.
# Each entry is a regex fragment matched against the package name.
PKG_PATTERNS=(
  "lib-js-common"
  "lib-react"
  "lib-lambda"
  "react-router-dom"
)

# Join the list into an alternation regex, e.g. "lib-react|lib-lambda|...".
pattern=$(IFS='|'; echo "${PKG_PATTERNS[*]}")

mapfile -t dupes < <(jq -r --arg pattern "$pattern" '
  .packages
  | to_entries
  | map(select(.key | startswith("node_modules/")))
  | map({name: (.key | sub(".*node_modules/"; ""))})
  | group_by(.name)
  | map(select(length > 1))
  | .[].[0].name
  # keep only the packages known to cause problems when duplicated
  | select(test($pattern))
' package-lock.json)

pkgs=$(IFS=','; echo "${dupes[*]}")
if [[ -n "${pkgs}" ]]; then
  echo "Error: found ${#dupes[*]} packages dangerously duplicated in the dependency tree: [$pkgs]. This is known to cause issues. Please update your package.json to ensure only one version of this package is present in node_modules." >&2
  exit 1
fi