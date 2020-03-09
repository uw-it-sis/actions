#!/bin/sh -l
#================================================================================
#
# Gather args ...
#
WORKDIR=$1
ARTIFACT_BUCKET_BASE=$2
ARTIFACT=$3
REPO_OVERRIDE=$4

#
# Determine the repo name. If no override is provided then get the name from the GitHub built-in: GITHUB_REPOSITORY
#
if [ "$REPO_OVERRIDE" = "unset" ]; then
  # This regex expects
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
ls -al

#
# Get the branch name
# https://github.community/t5/GitHub-Actions/Wrong-branch-displayed-for-workflow/m-p/37985#M3178
#
export _BRANCH=`(echo ${GITHUB_REF} | cut -d\/ -f3)`
#
# Make _BRACH available in subsequent steps/jobs.
#
echo "::set-env name=branch::$_BRANCH"

#
# Set the artifact bucket name based on the branch.
#
case "$_BRANCH" in
    "master")
      # Master goes to the unqualified bucket.
      # echo "::set-env name=_BUCKET::$ARTIFACT_BUCKET_BASE"
      export _BUCKET=$ARTIFACT_BUCKET_BASE
      ;;
    "development")
      # Development goes to the dev bucket.
      #echo "::set-env name=_BUCKET::$ARTIFACT_BUCKET_BASE-dev"
      export _BUCKET="${ARTIFACT_BUCKET_BASE}-dev"
      ;;
    *)
      # Evaluation and Patch both go to the eval bucket
      #echo "::set-env name=_BUCKET::${ARTIFACT_BUCKET_BASE}-eval"
      export _BUCKET="${ARTIFACT_BUCKET_BASE}-eval"
      ;;
esac
# Write the bucket name to outputs.
echo "::set-env name=artifactBucket::${_BUCKET}"

#
# Get the version
#
export _VERSION=`jq -r .version package.json`
echo "::set-env name=version::$_VERSION"

#export _OBJECT_NAME="${REPO_NAME}/${_VERSION}/${ARTIFACT}"
# FIXME: Hard override for testing.
export _OBJECT_NAME="bb-spa/1.0.0/course-ui.tgz"
echo "::set-env name=s3Object::$_OBJECT_NAME"

#
# Artifacts in the release/master bucket should not be overwritten, so check and fail if it does.
#
if [ ${_BRANCH} = "master" ]; then
  aws s3api head-object --bucket $_BUCKET --key $_OBJECT_NAME &>/dev/null
  retVal=$?
  # The exit code will be 255 if the artifact is 404 and 0 if it exists. Note: The space between the bracket and
  # the $ is very important.
  if [ $retVal -eq 0 ]; then
     echo  "${_BUCKET}/${_OBJECT_NAME} already exists and cannot be overwritten by this job."
     exit 1
  fi
fi

#
# Copy the artifact to the S3 bucket.
#
echo "ARTIFACT: ${ARTIFACT}"
aws s3 cp "${WORKDIR}${ARTIFACT}" s3://${_BUCKET}/$_OBJECT_NAME