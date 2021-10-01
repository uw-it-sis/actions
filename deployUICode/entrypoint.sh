#!/usr/bin/env bash
#=======================================================================================================================
#
# Grabs a zip archive from a the given S3 bucket. Un-archives it and then publishes it to the given S3 bucket.
#
#=======================================================================================================================

set -euo pipefail

if [ "$#" -ne 4 ]; then
    echo "Usage: ./$0 SRC_FILE DEST_DIRECTORY COLLECTIVE ENV"
    exit 1;
fi

SRC_S3_FILE=$1
DEST_S3_BUCKET=$2
COLLECTIVE=$3
ENVIRONMENT=$4

# Determine the directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export TMPDIR=$DIR
WORK_DIR=`mktemp -d`

# Delete the tmp directory and all of its contents.
function cleanup {
  rm -rf "$WORK_DIR"
  echo "Deleted working directory [$WORK_DIR]."
}

# Register the cleanup function to be called on the EXIT signal.
trap cleanup EXIT

#
# Do the work.
#
cd $WORK_DIR;
# Grab the artifact.
echo "Downloading $SRC_S3_FILE"
aws s3 cp $SRC_S3_FILE .
# Discover the file name
ARCHIVE_NAME=`ls`
echo "Unarchiving $ARCHIVE_NAME"
tar xzf $ARCHIVE_NAME
# Remove the archive
rm $ARCHIVE_NAME
# Discover the name of the unarchived directory.
DIRECTORY_NAME=`ls`
# Now sync it to the application code bucket
echo "Writing $DIRECTORY_NAME to $DEST_S3_BUCKET/$DIRECTORY_NAME"
aws s3 sync $DIRECTORY_NAME $DEST_S3_BUCKET/$DIRECTORY_NAME --quiet


#
# Invalidate the cloudfront distribution cache
#
distribution_id=$(aws cloudfront list-distributions | jq -r '.DistributionList.Items[] | select(.Comment == "'$COLLECTIVE-$ENVIRONMENT' CDN") | .Id')
invalidation_id=$(aws cloudfront create-invalidation --distribution-id $distribution_id --paths "/*" | jq -r .Invalidation.Id )

echo -n "invalidating CloudFront cache..."

# poll and wait until the invalidation is finished.
while true; do
   status=$(aws cloudfront get-invalidation --distribution-id=$distribution_id --id=$invalidation_id | jq -r .Invalidation.Status)
   if [[ $status = "Completed" ]]; then
      break
   fi
   sleep 1
done
