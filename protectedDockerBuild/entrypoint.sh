#!/bin/sh -l
#================================================================================
#
# Gather args ...
#
ARTIFACT=$1
DOCKERFILE_PATH=$2
GITHUB_REPOSITORY_PATH=$3
DOCKER_LOGIN_TOKEN=$4

GRADLE_PROPERTIES='gradle.properties'

if [ -f $GRADLE_PROPERTIES ]
then
  echo Checking version
else
  echo No file found: "$GRADLE_PROPERTIES" , exiting
  exit 1
fi

_VERSION=NONE
while read line; do
  if [ "${line:0:8}" = "version:" ]
  then
    _VERSION=`echo "$line" | sed 's/version://g' | sed 's/ //g'`
  fi
done < $GRADLE_PROPERTIES

# prepend a 'v' to the version to form the tag name
tagName=v$_VERSION
if [ "$_VERSION" = "NONE" ]
then
  echo No version found in "$GRADLE_PROPERTIES" , exiting
  exit 1
fi

allTags=( `git tag -l` )

foundTag=false
for item in "${allTags[@]}"; do
  if [ "$tagName" = "$item" ]
  then
    foundTag=true
    break
  fi
done

# build the docker image
exec docker login -u sudduth@uw.edu -p $DOCKER_LOGIN_TOKEN docker.pkg.github.com
exec docker build  -f $DOCKERFILE_PATH -t docker.pkg.github.com/$GITHUB_REPOSITORY_PATH/$ARTIFACT:$_VERSION .

# push the build to the repository only if there is no existing tag for the discovered version
if [ "$foundTag" = true ]
then
  echo Found existing tag for version $_VERSION , docker image will not be pushed
else
  exec docker push docker.pkg.github.com/$GITHUB_REPOSITORY_PATH/$ARTIFACT:$_VERSION
  echo Docker image for $ARTIFACT version $_VERSION push attempt complete
fi
