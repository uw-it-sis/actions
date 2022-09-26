#!/bin/sh -l
#================================================================================
#
# This script safely publishes docker images for gradle repos, preventing a released image from being overwritten.
# It does this by looking at tags in the git repo - if the tag for the version already exists, it has been released and the image will not be overwritten.

# Gather args ...
ARTIFACT=$1
DOCKERFILE_PATH=$2
DOCKER_LOGIN_TOKEN=$3

# This is a magic env-var available in github actions contexts
GITHUB_REPOSITORY_PATH=$GITHUB_REPOSITORY

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

if [ "$_VERSION" = "NONE" ]
then
  echo No version found in "$GRADLE_PROPERTIES" , exiting
  exit 1
fi

# prepend a 'v' to the version to form the tag name
tagName=v$_VERSION

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
docker login -u igored@uw.edu -p $DOCKER_LOGIN_TOKEN ghcr.io
docker build  -f $DOCKERFILE_PATH -t ghcr.io/$GITHUB_REPOSITORY_PATH/$ARTIFACT:$_VERSION .

# push the build to the repository only if there is no existing tag for the discovered version
if [ "$foundTag" = true ]
then
  echo Found existing tag for version $_VERSION , docker image will not be pushed
else
  docker push ghcr.io/$GITHUB_REPOSITORY_PATH/$ARTIFACT:$_VERSION
  echo Docker image for $ARTIFACT version $_VERSION push attempt complete
fi
