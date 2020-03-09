#!/bin/sh -l
#================================================================================
#
# Gather args ...
#
ARTIFACT_BUCKET_BASE=$1
ARTIFACT=$2
REPO_OVERRIDE=$3

#
# Determine the repo name. If no override is provided then get the name from the GitHub built-in: GITHUB_REPOSITORY
#
if [ $REPO_OVERRIDE = "unset" ]; then
  # This regex expects a / e.g. uw-it-sis/repo-name
  [[ $GITHUB_REPOSITORY =~ /(.*) ]] && REPO_NAME = ${BASH_REMATCH[1]}
fi

#
# Get the branch name
# https://github.community/t5/GitHub-Actions/Wrong-branch-displayed-for-workflow/m-p/37985#M3178
#
_BRANCH=`(echo ${GITHUB_REF} | cut -d\/ -f3)`
#
# Make _BRACH available in subsequent steps/jobs.
#
#echo "::set-env name=_BRANCH::$_BRANCH"
#
# Set the artifact bucket name based on the branch.
#
case "$_BRANCH" in
    "master")
      # Master goes to the unqualified bucket.
      # echo "::set-env name=_BUCKET::$ARTIFACT_BUCKET_BASE"
      _BUCKET=$ARTIFACT_BUCKET_BASE
      ;;
    "development")
      # Development goes to the dev bucket.
      #echo "::set-env name=_BUCKET::$ARTIFACT_BUCKET_BASE-dev"
      _BUCKET="${ARTIFACT_BUCKET_BASE}-dev"
      ;;
    *)
      # Evaluation and Patch both go to the eval bucket
      #echo "::set-env name=_BUCKET::${ARTIFACT_BUCKET_BASE}-eval"
      _BUCKET="${ARTIFACT_BUCKET_BASE}-eval"
      ;;
esac

#
# Get the version
#
export _VERSION=`(npm ls --depth=-1 | cut -s -d "@" -f 3 | cut -d " " -f1)`
#echo "::set-env name=_VERSION::$_VERSION"

#_OBJECT_NAME="${REPO_NAME}/${_VERSION}/${ARTIFACT}"
# FIXME: Hard override for testing.
_OBJECT_NAME="bb-spa/1.0.0/course-ui.tgz"

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
aws s3 cp $ARTIFACT s3://${_BUCKET}/$_OBJECT_NAME