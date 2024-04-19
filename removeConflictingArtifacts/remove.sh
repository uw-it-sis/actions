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

# Storage for package names contained in the poms ...
packageNames=()

# Find all of the POMs ... (don't find items in test directories e.g. The Claw)
poms=( $(find . -not -path "*/test/*" -name pom.xml) )

for fileName in "${poms[@]}"; do
  groupId=$(xmllint --xpath '/*[local-name()="project"]/*[local-name()="groupId"]/text()' $fileName 2>/dev/null)
  artifactId=$(xmllint  --xpath '/*[local-name()="project"]/*[local-name()="artifactId"]/text()' $fileName)
  if [[ -n "$groupId" ]]; then
    groupId=$topGroupId
  fi
  packageNames+=("$groupId.$artifactId")
done

# Storage for deletes ...
versionsToDelete=()
packagesToDelete=()

for p in "${packageNames[@]}"; do
  echo "Resolving artifact conflicts for package $p version $version"

  # Query for the number of versions which are published for the given package ...
  versionCount=$(curl -s -L -X GET -H "Accept: application/vnd.github+json"  -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Authorization: Bearer ${token}" https://api.github.com/orgs/uw-it-sis/packages/maven/${p} \
    | jq '.version_count' 2>/dev/null)

  # Query for the package id of the given version ...
  id=$(curl -s -L -X GET -H "Accept: application/vnd.github+json"  -H "X-GitHub-Api-Version: 2022-11-28" \
      -H "Authorization: Bearer ${token}" \
      https://api.github.com/orgs/uw-it-sis/packages/maven/${p}/versions \
      | jq --arg v "$version" '.[] | select(.name==$v)| .id' )

echo "ID: $id"

  # If there's only a single version and it matches the given version the add it to the package delete array. Otherwise,
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



