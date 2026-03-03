#!/bin/bash
#
# Verify args ....
#
token=$1
if [[ -z $token ]]; then
  echo "Fatal: Missing token arg"
  exit 1
fi

version=$2
if [[ -z $version ]]; then
  echo "Fatal: Missing version arg"
  exit 1
fi

# Snapshot versions don't need to be delete so just exit success if the
if [[ "$version" = *-SNAPSHOT  ]]; then
  echo "No action necessary for SNAPSHOTs"
  exit 0
fi

#
# Get the groupId out of the project POM ...
# Making an assumption here that all of our Maven project have a pom.xml at the top level.
# The Claw requires that so I think it's pretty safe to assume.
#
topGroupId=($(xmllint --xpath '/*[local-name()="project"]/*[local-name()="groupId"]/text()' pom.xml))
if [[ -z "$topGroupId" ]]; then
  topGroupId=$(xmllint --xpath '/*[local-name()="project"]/*[local-name()="parent"]/*[local-name()="groupId"]/text()' pom.xml 2>/dev/null)
fi

if [[ -z "$topGroupId" ]]; then
  echo "Fatal: Could not resolve groupId from root pom.xml"
  exit 1
fi
# Storage for package names contained in the poms ...
packageNames=()

# Find all of the POMs ... (don't find items in test directories e.g. The Claw)
poms=( $(find . -not -path "*/test/*" -name pom.xml) )

for fileName in "${poms[@]}"; do
  groupId=$(xmllint --xpath '/*[local-name()="project"]/*[local-name()="groupId"]/text()' $fileName 2>/dev/null)
  artifactId=$(xmllint  --xpath '/*[local-name()="project"]/*[local-name()="artifactId"]/text()' $fileName)
  # Validate artifactId was successfully parsed before proceeding.
  # Previously, a parse failure would silently produce a wrong package name
  # by combining the fallback groupId with a bad/empty artifactId, potentially
  # targeting the wrong package for deletion.
  if [[ -z "$artifactId" ]]; then
    echo "Warning: Could not parse artifactId from $fileName, skipping"
    continue
  fi

  if [[ -z "$groupId" ]]; then
    groupId=$(xpath_query '/*[local-name()="project"]/*[local-name()="parent"]/*[local-name()="groupId"]/text()' "$fileName")
  fi

  if [[ -z "$groupId" ]]; then
    groupId="$topGroupId"
  fi

  # Also guard against a missing groupId after fallback.
  if [[ -z "$groupId" ]]; then
    echo "Warning: Could not resolve groupId for $fileName, skipping"
    continue
  fi
  packageNames+=("$groupId.$artifactId")
done

# Storage for deletes ...
versionsToDelete=()
packagesToDelete=()

for p in "${packageNames[@]}"; do
  echo "Resolving artifact conflicts for package $p version $version"

  # Query for the number of versions which are published for the given package ...
  # Make a single API call for the versions list
  # instead of two separate calls for version_count and version id.
  # Calculating versionCount from the list length ensures it's consistent with
  # the id lookup, eliminating the race condition between two separate calls.
  versions_json=$(curl -s -L -X GET -H "Accept: application/vnd.github+json"  -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Authorization: Bearer ${token}" \
     "https://api.github.com/orgs/uw-it-sis/packages/maven/${p}/versions")

  versionCount=$(echo "$versions_json" | jq 'length' 2>/dev/null)
  id=$(echo "$versions_json" | jq --arg v "$version" '.[] | select(.name==$v) | .id' 2>/dev/null)

  # If there's only a single version and it matches the given version then add it to the package delete array. Otherwise,
  # shouldn't be a conflict, so just skip it.
  if [[ "$versionCount" -eq 1 ]]; then
    if [[ -n "$id" ]]; then
      echo "Queuing package $p ($id) for removal"
      packagesToDelete+=(${p})
    else
      echo "No corresponding version was found for $p"
    fi
  else
    # Otherwise, if there are multiple versions and the given version is one of them add the path to the resource to the
    # versionsToDelete array  ...
    if [[ -n "$id" ]]; then
      echo "Queuing package $p version $id for removal"
      versionsToDelete+=(${p}/versions/${id})
    else
      echo "No corresponding version was found for $p"
    fi
  fi
done

#
# Iterate through the package deletes and delete them ...
#
for package in "${packagesToDelete[@]}"; do
  echo "Deleting package: $package"
  curl -s -L -X DELETE -H "Accept: application/vnd.github+json"  -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Authorization: Bearer ${token}" \
    https://api.github.com/orgs/uw-it-sis/packages/maven/${package}
done

#
# Iterate through the list of versions and delete them ...
#
for releasePath in "${versionsToDelete[@]}"; do
  echo "Deleting: $releasePath"
  curl -s -L -X DELETE -H "Accept: application/vnd.github+json"  -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Authorization: Bearer ${token}" \
    https://api.github.com/orgs/uw-it-sis/packages/maven/${releasePath}
done



