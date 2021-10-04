#!/bin/sh -l
#================================================================================
#
# Gather args ...
#
WORKDIR=$1
COLLECTIVE=$2
ARTIFACT_BUCKET_BASE=$3
ARTIFACT=$4
REPO_OVERRIDE=$5

#
# Determine the repo name. If no override is provided then get the name from the GitHub built-in: GITHUB_REPOSITORY
#
if [ "$REPO_OVERRIDE" = "unset" ]; then
  REPO_NAME=(`echo $GITHUB_REPOSITORY | cut -d\/ -f2`)
  if [ "${REPO_NAME}" = "" ]; then
    echo "Couldn't parse repo name from [${GITHUB_REPOSITORY}]"
    exit 1
  fi
fi

#
# Get into the correct directory.
#
cd $WORKDIR

#
# Get the branch name
# https://github.community/t5/GitHub-Actions/Wrong-branch-displayed-for-workflow/m-p/37985#M3178
#
export _BRANCH=`(echo ${GITHUB_REF} | cut -d\/ -f3)`
#
# Make _BRANCH available in subsequent steps/jobs.
#
echo "branch=${_BRANCH}" >> $GITHUB_ENV
echo "::set-output name=branch::${_BRANCH}"

#
# Set the artifact bucket name based on the branch.
#
case "$_BRANCH" in
    "master")
      # Master goes to the prod bucket.
      export _BUCKET="${COLLECTIVE}-prod-${ARTIFACT_BUCKET_BASE}"
      ;;
    "development")
      # Development goes to the dev bucket.
      export _BUCKET="${COLLECTIVE}-dev-${ARTIFACT_BUCKET_BASE}"
      ;;
    *)
      # Evaluation and Patch both go to the eval bucket
      export _BUCKET="${COLLECTIVE}-eval-${ARTIFACT_BUCKET_BASE}"
      ;;
esac
# Write the bucket name to outputs.
echo "artifactBucket=${_BUCKET}" >> $GITHUB_ENV
echo "::set-output name=artifactBucket::${_BUCKET}"
echo "artifactBucket=${_BUCKET}" # >> $GITHUB_ENV  # TODO DELETE ME

#
# Get the version
#
if [ ! -f "package.json" ]; then
    echo "There was no package.json in ${WORKDIR}."
    exit 1
fi
export _VERSION=`jq -r .version package.json`
echo "version=${_VERSION}" >> $GITHUB_ENV
echo "::set-output name=version::${_VERSION}"

#
# Put together the object name for the upload.
#
export _OBJECT_NAME="${REPO_NAME}/${_VERSION}/${ARTIFACT}"
echo "s3Object=${_OBJECT_NAME}" >> $GITHUB_ENV
echo "::set-output name=s3Object::${_OBJECT_NAME}"

#
# Put together the full path for the staged artifact
#
export _S3_ARTIFACT_URI="s3://${_BUCKET}/$_OBJECT_NAME"
echo "s3ArtifactUri=${_S3_ARTIFACT_URI}" >> $GITHUB_ENV
echo "::set-output name=s3ArtifactUri::${_S3_ARTIFACT_URI}"

#
# Artifacts in the release/master bucket should not be overwritten, so check and fail if it does.
#
if [ ${_BRANCH} = "master" ]; then
  aws s3api head-object --bucket $_BUCKET --key $_OBJECT_NAME &>/dev/null
  retVal=$?
  # The exit code will be 255 if the artifact does not exist or 0 if it exists.
  # Note: The space between the bracket and the $ is very important.
  if [ $retVal -eq 0 ]; then
     echo  "${_BUCKET}/${_OBJECT_NAME} already exists and cannot be overwritten by this job."
     exit 1
  fi
fi

#
# Copy the artifact to the S3 bucket.
#
aws s3 cp $ARTIFACT $_S3_ARTIFACT_URI