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
AWS_REGION=$6

function main() {
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
  export _BRANCH=$(echo ${GITHUB_REF} | cut -d\/ -f3)
  set-output branch $_BRANCH

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
      "evaluation")
        # Evaluation goes to the eval bucket
        export _BUCKET="${COLLECTIVE}-eval-${ARTIFACT_BUCKET_BASE}"
        ;;
      "patch")
        # Patch artifacts should go in both the dev and eval buckets

        #
        # Set bucket to dev and stage the artifact
        #
        export _BUCKET="${COLLECTIVE}-dev-${ARTIFACT_BUCKET_BASE}"
        set_vars
        stage-artifact $ARTIFACT $_BUCKET $OBJECT_NAME

        #
        # Set the bucket to eval, and let the main code do the staging
        #
        export _BUCKET="${COLLECTIVE}-eval-${ARTIFACT_BUCKET_BASE}"
        ;;
      *)
        echo >&2 "This isn't an SCM-workflow branch. Exiting"
        exit 1
        ;;
  esac

  set_vars
  stage-artifact $ARTIFACT $_BUCKET $OBJECT_NAME $AWS_REGION
}

#
# UTIL FUNCTIONS
#

#
# Set global variables (and outputs)
#
function set_vars() {
  set-output artifactBucket $_BUCKET

  #
  # Get the version
  #
  if [ ! -f "package.json" ]; then
      echo "There was no package.json in ${WORKDIR}."
      exit 1
  fi
  export VERSION=`jq -r .version package.json`
  set-output version $VERSION

  #
  # Put together the object name for the upload.
  #
  export OBJECT_NAME="$REPO_NAME/$VERSION/$ARTIFACT"
  set-output s3Object $OBJECT_NAME

  #
  # Put together the full path for the staged artifact
  #
  set-output s3ArtifactUri "s3://$_BUCKET/$OBJECT_NAME"
}

#
# This function takes a variable name and value, and will:
#   - Write the name/value to $GITHUB_ENV, for use in subsequent github steps/jobs
#   - Set an output parameter with that name/value
#
function set-output() {
  local name="$1"
  local value="$2"

  echo "setting output: $name=$value"
  echo "$name=$value" >> $GITHUB_ENV
  echo "::set-output name=$name::$value"
}

#
# A function that stages an artifact in an artifact bucket.
#
# params:
#   $1 : artifact - The file path of the artifact to stage
#   $2 : bucket - The name of the s3 bucket to stage the artifact in
#   $3 : object_name - The path of the artifact object within the s3 bucket
#   $4 : aws_region - The region where the lambda needs to be deployed
#
# Also requires the $BRANCH global to be set
#
function stage-artifact() {
  local artifact="$1"
  local bucket="$2"
  local object_name="$3"
  local aws_region="$4"

  echo "AWS REGION: $aws_region"
  #
  # Artifacts in the release/master bucket should not be overwritten, so check and fail if it does.
  #
  if [ ${_BRANCH} = "master" ]; then
    aws s3api head-object --bucket $bucket --key $object_name &>/dev/null
    retVal=$?
    # The exit code will be 255 if the artifact does not exist or 0 if it exists.
    # Note: The space between the bracket and the $ is very important.
    if [ $retVal -eq 0 ]; then
       echo  "$bucket/$object_name already exists and cannot be overwritten by this job."
       exit 1
    fi
  fi

  #
  # Copy the artifact to the S3 bucket.
  #
  #aws s3 cp "$artifact" "s3://$bucket/$object_name"
  if [ "$aws_region" = "unset" ]; then
        aws s3 cp "$artifact" "s3://$bucket/$object_name"
        # The exit code will be 255 if the artifact does not exist or 0 if it exists.
        # Note: The space between the bracket and the $ is very important.
        else
          aws s3 cp "$artifact" "s3://$bucket/$object_name" --region "$aws_region"
      fi
  }
}

main "$@"